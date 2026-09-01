# FILE: apps/ai-service/app/services/risk_engine.py
# (full replacement)

import random

WEIGHTS = {
    "attendance_anomaly": 25,
    "cctv_irregularity": 15,
    "previous_violations": 0,     # enabled once `actions` table is in use (Phase 12)
    "complaints": 0,               # enabled when complaint counts are wired in
    "report_inconsistency": 15,    # now active
    "inspection_overdue": 0,       # enabled once `inspections` table is in use (Phase 7+)
    "random_factor": 5,
}


def band_for_score(score: int) -> str:
    if score <= 30:
        return "LOW"
    if score <= 60:
        return "MEDIUM"
    if score <= 80:
        return "HIGH"
    return "CRITICAL"


def compute_risk_score(signals: dict) -> dict:
    """
    signals = {
        "attendance_deviation_pct": float | None,
        "cctv_offline": bool,
        "report_similarity_pct": float | None,
    }
    """
    score = 0
    reasons = []

    deviation = signals.get("attendance_deviation_pct")
    if deviation is not None and deviation >= 30:
        score += WEIGHTS["attendance_anomaly"]
        reasons.append({
            "signal": "attendance_anomaly",
            "weight": WEIGHTS["attendance_anomaly"],
            "detail": f"Attendance deviates {deviation}% from historical average",
        })

    if signals.get("cctv_offline"):
        score += WEIGHTS["cctv_irregularity"]
        reasons.append({
            "signal": "cctv_irregularity",
            "weight": WEIGHTS["cctv_irregularity"],
            "detail": "CCTV is currently offline",
        })

    similarity = signals.get("report_similarity_pct")
    if similarity is not None and similarity >= 90:
        score += WEIGHTS["report_inconsistency"]
        reasons.append({
            "signal": "report_inconsistency",
            "weight": WEIGHTS["report_inconsistency"],
            "detail": f"Latest report is {similarity}% similar to the previous submission",
        })

    random_component = random.randint(0, WEIGHTS["random_factor"])
    score += random_component

    score = max(0, min(100, score))

    return {
        "score": score,
        "band": band_for_score(score),
        "reasons": reasons,
    }