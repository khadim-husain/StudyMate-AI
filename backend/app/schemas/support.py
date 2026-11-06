from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime

class SupportTicketCreate(BaseModel):
    subject: str = Field(..., min_length=3, max_length=255)
    category: str = Field(..., min_length=2, max_length=100)
    description: str = Field(..., min_length=5)

class SupportTicketResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    subject: str
    category: str
    description: str
    status: str
    created_at: datetime
    updated_at: datetime

