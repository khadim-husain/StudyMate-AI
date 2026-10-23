from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import List, Optional

class SummaryCreate(BaseModel):
    summary_type: str = Field(default="medium", pattern="^(short|medium|detailed)$", json_schema_extra={"example": "medium"})

class SummaryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    document_id: str
    summary_type: str
    content: str
    key_concepts: Optional[List[str]] = []
    revision_notes: Optional[List[str]] = []
    created_at: datetime
