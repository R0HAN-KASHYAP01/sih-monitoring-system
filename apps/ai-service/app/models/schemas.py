# FILE: apps/ai-service/app/models/schemas.py
# (full replacement)

from pydantic import BaseModel
from typing import Optional, List


class ScoreRequest(BaseModel):
    institute_id: str
    attendance_deviation_pct: Optional[float] = None
    cctv_offline: bool = False
    report_similarity_pct: Optional[float] = None

class Reason(BaseModel):
    signal: str
    weight: int
    detail: str


class ScoreResponse(BaseModel):
    score: int
    band: str
    reasons: List[Reason]


# FILE: apps/ai-service/app/models/schemas.py
# (add these two classes to the existing file, alongside ScoreRequest etc.)

class SimilarityRequest(BaseModel):
    current_text: str
    previous_text: str


class SimilarityResponse(BaseModel):
    similarity_pct: float