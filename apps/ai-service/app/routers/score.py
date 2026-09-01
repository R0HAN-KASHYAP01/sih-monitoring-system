# FILE: apps/ai-service/app/routers/score.py
# (full replacement)

from fastapi import APIRouter
from app.models.schemas import ScoreRequest, ScoreResponse
from app.services.risk_engine import compute_risk_score

router = APIRouter()


@router.post("/score", response_model=ScoreResponse)
def score(request: ScoreRequest):
    result = compute_risk_score({
        "attendance_deviation_pct": request.attendance_deviation_pct,
        "cctv_offline": request.cctv_offline,
        "report_similarity_pct": request.report_similarity_pct,
    })
    return result