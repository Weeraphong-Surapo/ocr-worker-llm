from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, File, HTTPException, UploadFile

from .config import get_settings
from .engine import OCREngine
from .schemas import GPUHealth, OCRDocumentResult

settings = get_settings()
engine: Optional[OCREngine] = None


@asynccontextmanager
async def lifespan(_: FastAPI):
    global engine
    engine = OCREngine(settings)
    yield
    engine = None


app = FastAPI(title=settings.app_name, version='0.1.0', lifespan=lifespan)


@app.get('/health')
def health() -> dict:
    return {'status': 'ok', 'ocr_model_loaded': bool(engine and engine._ocr)}


@app.get('/health/gpu', response_model=GPUHealth)
def gpu_health() -> GPUHealth:
    if engine is None:
        return GPUHealth(available=False, device=settings.ocr_device, error='engine_not_ready')
    return engine.gpu_health()


@app.post('/ocr', response_model=OCRDocumentResult)
async def ocr(file: UploadFile = File(...)) -> OCRDocumentResult:
    if not file.filename:
        raise HTTPException(status_code=400, detail='filename is required')
    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail='file is empty')
    if len(data) > settings.max_file_size_bytes:
        raise HTTPException(status_code=413, detail='file is too large')
    if engine is None:
        raise HTTPException(status_code=503, detail='OCR engine is not ready')
    try:
        return engine.process(data, file.filename)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
