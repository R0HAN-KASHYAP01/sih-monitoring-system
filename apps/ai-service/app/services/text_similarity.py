# FILE: apps/ai-service/app/services/text_similarity.py

import difflib


def compute_similarity_pct(text_a: str, text_b: str) -> float:
    """
    Returns a similarity percentage (0-100) between two pieces of text.
    Uses difflib's SequenceMatcher — no external dependencies needed,
    good enough to catch copy-pasted or near-identical reports for MVP.
    """
    if not text_a or not text_b:
        return 0.0

    ratio = difflib.SequenceMatcher(None, text_a, text_b).ratio()
    return round(ratio * 100, 1)