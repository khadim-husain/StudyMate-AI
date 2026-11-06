from pydantic import BaseModel, EmailStr, ConfigDict, Field
from datetime import datetime

class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    full_name: str
    email: EmailStr
    avatar_url: str | None = None
    created_at: datetime
    updated_at: datetime

class UserUpdate(BaseModel):
    full_name: str | None = None
    email: EmailStr | None = None
    avatar_url: str | None = None

class PasswordChangeRequest(BaseModel):
    current_password: str = Field(..., min_length=6)
    new_password: str = Field(..., min_length=6)

class UserPreferenceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    notifications_enabled: bool
    study_reminders: bool
    task_deadline_reminders: bool
    quiz_reminders: bool
    daily_study_goals: bool
    doc_processing_notifications: bool
    theme: str
    language: str

class UserPreferenceUpdate(BaseModel):
    notifications_enabled: bool | None = None
    study_reminders: bool | None = None
    task_deadline_reminders: bool | None = None
    quiz_reminders: bool | None = None
    daily_study_goals: bool | None = None
    doc_processing_notifications: bool | None = None
    theme: str | None = None
    language: str | None = None
