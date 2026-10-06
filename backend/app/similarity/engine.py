import hashlib
import re

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from .ollama import semantic_similarity


STOP_WORDS = {
    "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "in",
    "is", "it", "of", "on", "or", "that", "the", "this", "to", "using", "with",
}

COMPONENT_WEIGHTS = {
    "title": 0.10,
    "abstract": 0.25,
    "report": 0.20,
    "keywords": 0.15,
    "minhash": 0.10,
    "code": 0.20,
}


def _text(value):
    """Return clean text without allowing None to become the word 'none'."""
    return value if isinstance(value, str) else ""


def tokens(text):
    return [
        word
        for word in re.findall(r"[a-z0-9+#.-]+", _text(text).lower())
        if word not in STOP_WORDS and len(word) > 1
    ]


def preprocess(text):
    return " ".join(tokens(text))


def cosine(first, second):
    first = preprocess(first)
    second = preprocess(second)
    if not first or not second:
        return 0.0
    matrix = TfidfVectorizer(ngram_range=(1, 2)).fit_transform([first, second])
    return float(cosine_similarity(matrix[0], matrix[1])[0, 0])


def jaccard(first, second):
    first_tokens = set(tokens(first))
    second_tokens = set(tokens(second))
    union = first_tokens | second_tokens
    return len(first_tokens & second_tokens) / len(union) if union else 0.0


def shingles(text, size=3):
    words = tokens(text)
    return {
        " ".join(words[index:index + size])
        for index in range(max(0, len(words) - size + 1))
    }


def minhash(text, permutations=64):
    values = shingles(text) or set(tokens(text))
    if not values:
        return []
    return [
        min(
            int(hashlib.sha1(f"{seed}:{value}".encode()).hexdigest(), 16)
            for value in values
        )
        for seed in range(permutations)
    ]


def minhash_similarity(first, second):
    first_signature = minhash(first)
    second_signature = minhash(second)
    if not first_signature or not second_signature:
        return 0.0
    equal_hashes = sum(
        first_hash == second_hash
        for first_hash, second_hash in zip(first_signature, second_signature)
    )
    return equal_hashes / len(first_signature)


def normalize_code(code):
    code = re.sub(
        r"/\*.*?\*/|//[^\n]*|#[^\n]*",
        " ",
        _text(code),
        flags=re.S,
    )
    raw_tokens = re.findall(
        r"'(?:\\.|[^'\\])*'|\"(?:\\.|[^\"\\])*\"|\b\d+(?:\.\d+)?\b|"
        r"[A-Za-z_$][\w$]*|==|!=|<=|>=|&&|\|\||[-+*/%=<>!&|{}()[\];,.?:]",
        code,
    )
    reserved = {
        "if", "else", "for", "while", "return", "class", "def", "function",
        "import", "from", "new", "try", "catch", "public", "private", "static",
        "void", "int", "string", "const", "let", "var", "async", "await",
    }
    return " ".join(
        token.lower()
        if token.lower() in reserved or not re.match(r"[A-Za-z_$]", token)
        else "ID"
        for token in raw_tokens
    )


def code_similarity(first, second):
    first = normalize_code(first)
    second = normalize_code(second)
    if not first or not second:
        return 0.0
    return (cosine(first, second) + jaccard(first, second)) / 2


def classify(score):
    if score >= 0.85:
        return "Very High Similarity"
    if score >= 0.70:
        return "High Similarity"
    if score >= 0.50:
        return "Significant Similarity"
    if score >= 0.25:
        return "Moderate Similarity"
    return "Low Similarity"


def _combined_text(*parts):
    return " ".join(_text(part).strip() for part in parts if _text(part).strip())


def _keyword_text(value):
    if not isinstance(value, (list, tuple, set)):
        return ""
    return " ".join(_text(item) for item in value)


def _candidate_value(candidate, name):
    return getattr(candidate, name, None)


def _build_evidence(scores):
    evidence = []
    if scores["title"] >= 0.45:
        evidence.append("The project titles use closely related terminology")
    if scores["abstract"] >= 0.35:
        evidence.append("The abstracts and implementation descriptions discuss related ideas")
    if scores["report"] is not None and scores["report"] >= 0.35:
        evidence.append("The uploaded reports contain similar vocabulary and phrases")
    if scores["keywords"] >= 0.25:
        evidence.append("The projects share a strong set of declared topics and keywords")
    if scores["minhash"] >= 0.30:
        evidence.append("MinHash detected repeated three-word text patterns")
    if scores["code"] is not None and scores["code"] >= 0.35:
        evidence.append("The normalized source-code token structures are similar")
    return evidence or ["The candidate was ranked using the available evidence components"]


def compare_projects(query, candidate):
    """Compare a submitted project with one repository candidate."""
    query_abstract = _combined_text(query.get("abstract"), query.get("description"))
    candidate_abstract = _combined_text(
        _candidate_value(candidate, "abstract"),
        _candidate_value(candidate, "description"),
    )
    query_report = _text(query.get("report_text"))
    candidate_report = _text(_candidate_value(candidate, "report_text"))
    query_code = _text(query.get("source_code"))
    candidate_code = _text(_candidate_value(candidate, "source_code"))

    abstract_score = semantic_similarity(query_abstract, candidate_abstract)
    if abstract_score is None:
        abstract_score = cosine(query_abstract, candidate_abstract)

    scores = {
        "title": cosine(query.get("title"), _candidate_value(candidate, "title")),
        "abstract": abstract_score,
        "report": cosine(query_report, candidate_report)
        if query_report and candidate_report else None,
        "keywords": jaccard(
            _keyword_text(query.get("keywords")),
            _keyword_text(_candidate_value(candidate, "keywords")),
        ),
        "minhash": minhash_similarity(
            _combined_text(query_abstract, query_report),
            _combined_text(candidate_abstract, candidate_report),
        ),
        "code": code_similarity(query_code, candidate_code)
        if query_code and candidate_code else None,
    }

    available = {name: value for name, value in scores.items() if value is not None}
    available_weight = sum(COMPONENT_WEIGHTS[name] for name in available)
    overall_score = (
        sum(value * COMPONENT_WEIGHTS[name] for name, value in available.items())
        / available_weight
        if available_weight else 0.0
    )

    query_terms = set(tokens(_combined_text(
        _keyword_text(query.get("keywords")), query_abstract
    )))
    candidate_terms = set(tokens(_combined_text(
        _keyword_text(_candidate_value(candidate, "keywords")), candidate_abstract
    )))
    shared_keywords = sorted(query_terms & candidate_terms)[:10]

    rounded_scores = {
        name: round(value, 4) if value is not None else None
        for name, value in scores.items()
    }
    return {
        "score": round(overall_score, 4),
        "classification": classify(overall_score),
        "components": rounded_scores,
        "shared_keywords": shared_keywords,
        "evidence": _build_evidence(scores),
    }
