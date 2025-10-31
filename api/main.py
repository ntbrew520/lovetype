from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Dict, Any

from classifier import (
    get_types,
    classify_pair,
    health_status,
)

app = FastAPI(title="Lovetype Compatibility API", version="0.1.1")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class ScoreRequest(BaseModel):
    typeA: str
    typeB: str

@app.get("/")
def root() -> Dict[str, Any]:
    return {"service": "Lovetype Compatibility API", "ok": True, "endpoints": ["/health", "/types", "/score"]}

@app.get("/favicon.ico")
def favicon() -> Dict[str, str]:
    return {"ok": "no favicon"}

@app.get("/health")
def health() -> Dict[str, str]:
    return {"status": "ok", **health_status()}

@app.get("/types")
def types() -> JSONResponse:
    types_list = get_types() or []
    # 明示的に charset=utf-8 を指定
    return JSONResponse(content=types_list, media_type="application/json; charset=utf-8")

@app.post("/score")
def score(req: ScoreRequest) -> JSONResponse:
    try:
        result = classify_pair(req.typeA, req.typeB)
        return JSONResponse(content=result, media_type="application/json; charset=utf-8")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e))
