from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import List, Optional, Dict, Any

class Citation(BaseModel):
    document_id: str
    document_title: str
    page_number: int
    chunk_index: int
    text_snippet: str

class MessageCreate(BaseModel):
    content: str = Field(..., min_length=1, json_schema_extra={"example": "Can you explain backpropagation and loss functions?"})
    document_ids: Optional[List[str]] = Field(default=None, description="Optional list of document IDs to constrain retrieval")

class MessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    conversation_id: str
    role: str
    content: str
    citations: Optional[List[Dict[str, Any]]] = None
    created_at: datetime

class ConversationCreate(BaseModel):
    title: Optional[str] = Field(default="New Study Session", max_length=255)

class ConversationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    title: str
    created_at: datetime
    updated_at: datetime
    messages_count: int = 0
    last_message: Optional[str] = None

class ConversationDetailResponse(ConversationResponse):
    messages: List[MessageResponse] = []
