import os
import re
from functools import lru_cache

import httpx


def ollama_enabled():
    return os.getenv("OLLAMA_ENABLED", "true").lower() in {"1", "true", "yes", "on"}


@lru_cache(maxsize=512)
def embed(text):
    if not text or not ollama_enabled():
        return None
    base_url = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434").rstrip("/")
    model = os.getenv("OLLAMA_MODEL", "nomic-embed-text")
    try:
        response = httpx.post(
            f"{base_url}/api/embed",
            json={"model": model, "input": text},
            timeout=float(os.getenv("OLLAMA_TIMEOUT", "8")),
        )
        response.raise_for_status()
        embeddings = response.json().get("embeddings") or []
        return embeddings[0] if embeddings and embeddings[0] else None
    except (httpx.HTTPError, ValueError, KeyError, IndexError, TypeError):
        return None


def semantic_similarity(first, second):
    first_embedding = embed(first)
    second_embedding = embed(second)
    if not first_embedding or not second_embedding or len(first_embedding) != len(second_embedding):
        return generated_similarity(first, second)
    dot = sum(a * b for a, b in zip(first_embedding, second_embedding))
    first_norm = sum(value * value for value in first_embedding) ** 0.5
    second_norm = sum(value * value for value in second_embedding) ** 0.5
    if not first_norm or not second_norm:
        return None
    return max(0.0, min(1.0, dot / (first_norm * second_norm)))


@lru_cache(maxsize=256)
def generated_similarity(first, second):
    if not first or not second or not ollama_enabled():
        return None
    base_url = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434").rstrip("/")
    model = os.getenv("OLLAMA_MODEL", "qwen2.5-coder:7b")
    prompt = (
        "Compare the semantic similarity of these two academic project descriptions. "
        "Return only one decimal number between 0 and 1, where 0 is unrelated and 1 is identical.\n\n"
        f"TEXT A:\n{first}\n\nTEXT B:\n{second}"
    )
    try:
        response = httpx.post(
            f"{base_url}/api/generate",
            json={"model": model, "prompt": prompt, "stream": False, "options": {"temperature": 0}},
            timeout=float(os.getenv("OLLAMA_TIMEOUT", "8")),
        )
        response.raise_for_status()
        match = re.search(r"(?:^|\s)(0(?:\.\d+)?|1(?:\.0+)?)(?:\s|$)", response.json().get("response", ""))
        return max(0.0, min(1.0, float(match.group(1)))) if match else None
    except (httpx.HTTPError, ValueError, KeyError, TypeError, AttributeError):
        return None