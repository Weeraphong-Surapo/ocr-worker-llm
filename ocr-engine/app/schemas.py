from typing import List, Optional, Tuple
from pydantic import BaseModel, Field


Point = Tuple[int, int]


class OCRLine(BaseModel):
    text: str
    confidence: float = Field(ge=0.0, le=1.0)
    bbox: List[Point] = Field(min_length=4, max_length=4)


class OCRPage(BaseModel):
    page_number: int = Field(ge=1)
    width: Optional[int] = None
    height: Optional[int] = None
    text: str
    lines: List[OCRLine]


class OCRDocumentResult(BaseModel):
    status: str = 'completed'
    pages: List[OCRPage]


class GPUHealth(BaseModel):
    available: bool
    device: str
    paddle_version: Optional[str] = None
    device_count: int = 0
    error: Optional[str] = None
