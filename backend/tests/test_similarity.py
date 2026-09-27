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
