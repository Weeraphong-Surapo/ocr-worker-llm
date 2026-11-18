import pytest
from pydantic import ValidationError

from app.schemas import OCRLine


def test_ocr_line_accepts_quad_bbox():
    line = OCRLine(text='ภาษาไทย', confidence=0.98, bbox=[(1, 2), (3, 2), (3, 4), (1, 4)])
    assert line.text == 'ภาษาไทย'


def test_ocr_line_rejects_invalid_confidence():
    with pytest.raises(ValidationError):
        OCRLine(text='x', confidence=1.5, bbox=[(1, 2)] * 4)
