from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

class DocumentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    filename: str
    file_size: int
    page_count: int
    processing_status: str
    processing_error: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class DocumentStatusResponse(BaseModel):
    id: str
    filename: str
    processing_status: str
    processing_error: Optional[str] = None
    page_count: int
    chunk_count: int = 0

class DocumentDetailResponse(DocumentResponse):
    extracted_chunks_count: int = 0
