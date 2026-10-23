from pydantic import BaseModel, EmailStr, ConfigDict
from datetime import datetime

class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    full_name: str
    email: EmailStr
    created_at: datetime
    updated_at: datetime

class UserUpdate(BaseModel):
    full_name: str | None = None
    email: EmailStr | None = None
