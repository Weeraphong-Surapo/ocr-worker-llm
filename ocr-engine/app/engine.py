from io import BytesIO
from typing import Any, Dict, List, Optional

from PIL import Image

from .config import Settings
from .pdf_processor import is_pdf, iter_pdf_pages
from .schemas import GPUHealth, OCRDocumentResult, OCRLine, OCRPage


class OCREngine:
    def __init__(self, settings: Settings):
        self.settings = settings
        self._ocr = None
        self._load_error: Optional[str] = None
        self._load_model()

    def _load_model(self) -> None:
        try:
            from paddleocr import PaddleOCR
            self._ocr = PaddleOCR(
                lang='th',
                text_recognition_model_name=self.settings.model_name,
                device=self.settings.ocr_device,
                use_doc_orientation_classify=False,
                use_doc_unwarping=False,
                use_textline_orientation=False,
            )
        except Exception as exc:
            self._load_error = f'{type(exc).__name__}: {exc}'

    def gpu_health(self) -> GPUHealth:
        try:
            import paddle
            available = bool(paddle.is_compiled_with_cuda())
            count = int(paddle.device.cuda.device_count()) if available else 0
            return GPUHealth(
                available=available and count > 0,
                device=self.settings.ocr_device,
                paddle_version=paddle.__version__,
                device_count=count,
                error=self._load_error,
            )
        except Exception as exc:
            return GPUHealth(
                available=False,
                device=self.settings.ocr_device,
                error=f'{type(exc).__name__}: {exc}; model={self._load_error}',
            )

    def _ocr_image(self, image_bytes: bytes, page_number: int) -> OCRPage:
        if self._ocr is None:
            raise RuntimeError(f'OCR model is not available: {self._load_error}')

        image = Image.open(BytesIO(image_bytes)).convert('RGB')
        result = self._ocr.predict(image_bytes)
        lines: List[OCRLine] = []
        for item in result:
            data: Dict[str, Any] = item.json if hasattr(item, 'json') else item
            payload = data.get('res', data) if isinstance(data, dict) else {}
            texts = payload.get('rec_texts', [])
            scores = payload.get('rec_scores', [])
            boxes = payload.get('rec_polys', payload.get('dt_polys', []))
            for text, score, box in zip(texts, scores, boxes):
                points = [(int(point[0]), int(point[1])) for point in box]
                lines.append(OCRLine(text=str(text), confidence=float(score), bbox=points))

        return OCRPage(
            page_number=page_number,
            width=image.width,
            height=image.height,
            text='\n'.join(line.text for line in lines),
            lines=lines,
        )

    def process(self, data: bytes, filename: str) -> OCRDocumentResult:
        if is_pdf(data, filename):
            pages = [self._ocr_image(page_data, page_number)
                     for page_number, page_data in iter_pdf_pages(data, self.settings.max_pdf_pages)]
        else:
            pages = [self._ocr_image(data, 1)]
        return OCRDocumentResult(status='completed', pages=pages)
