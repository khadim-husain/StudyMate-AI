from pydantic import BaseModel, EmailStr, Field

class RegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=150, json_schema_extra={"example": "Alex Morgan"})
    email: EmailStr = Field(..., json_schema_extra={"example": "alex.morgan@university.edu"})
    password: str = Field(..., min_length=6, max_length=128, json_schema_extra={"example": "password123"})

class LoginRequest(BaseModel):
    email: str = Field(..., min_length=1, json_schema_extra={"example": "alex.morgan@university.edu"})
    password: str = Field(..., min_length=1, json_schema_extra={"example": "password123"})

class GoogleAuthRequest(BaseModel):
    id_token: str | None = None
    email: EmailStr | None = None
    name: str | None = None
    avatar_url: str | None = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    refresh_token: str | None = None
    expires_in_minutes: int

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class VerifyResetTokenRequest(BaseModel):
    email: EmailStr
    token: str

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    token: str
    new_password: str = Field(..., min_length=6, max_length=128, json_schema_extra={"example": "newsecurepassword123"})

class MessageResponse(BaseModel):
    message: str
    success: bool = True
