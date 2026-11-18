from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file='.env', extra='ignore')

    app_name: str = 'Thai OCR Engine'
    host: str = '0.0.0.0'
    port: int = 8000
    ocr_backend: str = 'paddle'
    ocr_device: str = 'gpu:0'
    max_file_size_mb: int = 20
    max_pdf_pages: int = 50
    model_name: str = 'th_PP-OCRv5_mobile_rec'

    @property
    def max_file_size_bytes(self) -> int:
        return self.max_file_size_mb * 1024 * 1024


@lru_cache
def get_settings() -> Settings:
    return Settings()
