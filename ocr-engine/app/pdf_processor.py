from io import BytesIO
from typing import Iterator, Tuple

import fitz


def iter_pdf_pages(data: bytes, max_pages: int) -> Iterator[Tuple[int, bytes]]:
    document = fitz.open(stream=data, filetype='pdf')
    try:
        if document.page_count > max_pages:
            raise ValueError(f'PDF page count {document.page_count} exceeds limit {max_pages}')
        for index in range(document.page_count):
            page = document.load_page(index)
            pixmap = page.get_pixmap(matrix=fitz.Matrix(2, 2), alpha=False)
            yield index + 1, pixmap.tobytes('png')
    finally:
        document.close()


def is_pdf(data: bytes, filename: str = '') -> bool:
    return data[:5] == b'%PDF-' or filename.lower().endswith('.pdf')
