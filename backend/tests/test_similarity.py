from types import SimpleNamespace
from unittest.mock import patch
from app.similarity.engine import classify, code_similarity, compare_projects, cosine, jaccard, normalize_code, preprocess
from app.similarity.ollama import semantic_similarity
def test_preprocess(): assert preprocess("The QUICK, brown fox!")=="quick brown fox"
def test_identical_cosine(): assert cosine("project similarity detection","project similarity detection")>.99
def test_empty_cosine(): assert cosine("","")==0
def test_unrelated_cosine(): assert cosine("apple orange","database network")==0
def test_jaccard(): assert jaccard("alpha beta","beta gamma")==1/3
def test_code_normalization(): assert "comment" not in normalize_code("// comment\nfunction sum(a,b){ return a+b; }")
def test_code_similarity(): assert code_similarity("def add(a,b): return a+b","def plus(x,y): return x+y")>.7
def test_classification(): assert classify(.72)=="High Similarity"
def test_unavailable_optional_components_are_not_presented_as_zero():
    candidate=SimpleNamespace(title="Project review",abstract="Compare academic projects",description="",report_text="",keywords=[],source_code="")
    query={"title":"Project review","abstract":"Compare academic projects","description":"","keywords":[],"report_text":"","source_code":""}
    result=compare_projects(query,candidate)
    assert result["components"]["report"] is None
    assert result["components"]["code"] is None
    assert result["components"]["title"] is not None

def test_ollama_similarity_uses_embedding_cosine():
    with patch("app.similarity.ollama.embed", side_effect=([1.0, 0.0], [1.0, 0.0])):
        assert semantic_similarity("first", "second") == 1.0

def test_abstract_similarity_falls_back_when_ollama_is_unavailable():
    candidate=SimpleNamespace(title="Project review",abstract="Compare academic projects",description="",report_text="",keywords=[],source_code="")
    query={"title":"Project review","abstract":"Compare academic projects","description":"","keywords":[],"report_text":"","source_code":""}
    with patch("app.similarity.engine.semantic_similarity", return_value=None):
        assert compare_projects(query,candidate)["components"]["abstract"] > .99


def test_identical_complete_projects_have_very_high_similarity():
    candidate = SimpleNamespace(
        title="Academic project similarity detector",
        abstract="Compare academic projects with explainable text analysis",
        description="FastAPI service for faculty review",
        report_text="TF-IDF cosine similarity compares project reports",
        keywords=["FastAPI", "TF-IDF", "similarity"],
        source_code="def compare(first, second): return first == second",
    )
    query = {
        "title": candidate.title,
        "abstract": candidate.abstract,
        "description": candidate.description,
        "report_text": candidate.report_text,
        "keywords": candidate.keywords,
        "source_code": candidate.source_code,
    }
    with patch("app.similarity.engine.semantic_similarity", return_value=None):
        result = compare_projects(query, candidate)
    assert result["score"] > 0.95
    assert result["classification"] == "Very High Similarity"
    assert len(result["evidence"]) >= 4


def test_missing_candidate_values_do_not_become_similarity_terms():
    candidate = SimpleNamespace(
        title="Unrelated record",
        abstract="Different subject",
        description=None,
        report_text=None,
        keywords=None,
        source_code=None,
    )
    query = {
        "title": "None management system",
        "abstract": "A project about another domain entirely",
        "description": "",
        "report_text": "",
        "keywords": [],
        "source_code": "",
    }
    with patch("app.similarity.engine.semantic_similarity", return_value=None):
        result = compare_projects(query, candidate)
    assert "none" not in result["shared_keywords"]
    assert result["components"]["report"] is None
    assert result["components"]["code"] is None


def test_missing_optional_evidence_is_removed_from_weighted_score():
    candidate = SimpleNamespace(
        title="Same title",
        abstract="The same sufficiently detailed project abstract",
        description="",
        report_text="",
        keywords=["shared"],
        source_code="",
    )
    query = {
        "title": candidate.title,
        "abstract": candidate.abstract,
        "description": "",
        "report_text": "",
        "keywords": ["shared"],
        "source_code": "",
    }
    with patch("app.similarity.engine.semantic_similarity", return_value=None):
        result = compare_projects(query, candidate)
    assert result["score"] > 0.95
    assert result["components"]["report"] is None
    assert result["components"]["code"] is None
