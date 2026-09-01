# FILE: apps/ai-service/app/main.py
# (register the new router)

from fastapi import FastAPI
from app.routers import score, similarity

app = FastAPI(title="SIH Risk Engine")

app.include_router(score.router)
app.include_router(similarity.router)


@app.get("/health")
def health():
    return {"status": "ok"}