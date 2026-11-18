import fitz
import pytest

from app.pdf_processor import iter_pdf_pages


def make_pdf(page_count: int) -> bytes:
    document = fitz.open()
    for index in range(page_count):
        page = document.new_page()
        page.insert_text((72, 72), f'หน้า {index + 1}')
    data = document.tobytes()
    document.close()
    return data


def test_pdf_pages_are_rendered_in_order():
    pages = list(iter_pdf_pages(make_pdf(2), max_pages=5))
    assert [number for number, _ in pages] == [1, 2]
    assert all(data.startswith(b'\x89PNG') for _, data in pages)


def test_pdf_page_limit_is_enforced():
    with pytest.raises(ValueError, match='exceeds limit'):
        list(iter_pdf_pages(make_pdf(2), max_pages=1))
