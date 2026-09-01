# FILE: apps/ai-service/app/routers/similarity.py

from fastapi import APIRouter
from app.models.schemas import SimilarityRequest, SimilarityResponse
from app.services.text_similarity import compute_similarity_pct

router = APIRouter()


@router.post("/similarity", response_model=SimilarityResponse)
def similarity(request: SimilarityRequest):
    pct = compute_similarity_pct(request.current_text, request.previous_text)
    return {"similarity_pct": pct}