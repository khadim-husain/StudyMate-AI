from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional

class FlashcardGenerateRequest(BaseModel):
    document_id: Optional[str] = None
    topic: Optional[str] = "Important Study Concepts"
    num_cards: int = Field(default=5, ge=1, le=25)

class FlashcardCreate(BaseModel):
    document_id: Optional[str] = None
    question: str = Field(..., min_length=2)
    answer: str = Field(..., min_length=2)

class FlashcardUpdate(BaseModel):
    question: Optional[str] = None
    answer: Optional[str] = None
    review_status: Optional[str] = Field(None, pattern="^(new|review|known|mastered)$")

class FlashcardReviewRequest(BaseModel):
    is_known: bool

class FlashcardResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    document_id: Optional[str]
    question: str
    answer: str
    review_status: str
    created_at: datetime
