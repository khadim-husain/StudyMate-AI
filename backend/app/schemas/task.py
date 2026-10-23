from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional

class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255, json_schema_extra={"example": "Review Chapter 4 Graph Algorithms"})
    subject: str = Field(default="General Study", max_length=100)
    description: Optional[str] = Field(default=None, max_length=1024)
    priority: str = Field(default="Medium", pattern="^(Low|Medium|High)$")
    due_date: Optional[datetime] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    subject: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = Field(None, pattern="^(Low|Medium|High)$")
    due_date: Optional[datetime] = None
    completed: Optional[bool] = None

class TaskResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    title: str
    subject: str
    description: Optional[str] = None
    priority: str
    due_date: Optional[datetime] = None
    completed: bool
    created_at: datetime
    updated_at: datetime
