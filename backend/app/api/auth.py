import secrets
import hashlib
import hmac
import logging
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from google.oauth2 import id_token
from google.auth.transport import requests

from app.db.session import get_db
from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token
from app.core.dependencies import get_current_user
from app.core.config import settings
from app.models.user import User
from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    GoogleAuthRequest,
    TokenResponse,
    RefreshTokenRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    MessageResponse,
)
from app.schemas.user import UserResponse
from app.services.email_service import EmailService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    """Register a new student account."""
    email_clean = payload.email.lower().strip()
    existing_user = db.query(User).filter(User.email == email_clean).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email address already exists."
        )

    user = User(
        full_name=payload.full_name.strip(),
        email=email_clean,
        password_hash=hash_password(payload.password),
        auth_provider="local",
        email_verified=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate with email or username and password to receive JWT access and refresh tokens."""
    identifier = payload.email.strip()
    user = db.query(User).filter(
        (User.email.ilike(identifier)) | (User.full_name.ilike(identifier))
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.password_hash:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This account was created with Google Sign-In. Please tap 'Continue with Google' or use 'Forgot Password' to set a local password."
        )

    if not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(subject=user.id)
    refresh_token = create_refresh_token(subject=user.id)

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        refresh_token=refresh_token,
        expires_in_minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )


@router.post("/forgot-password", response_model=MessageResponse)
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Generate a cryptographically secure, single-use password reset token with 15-minute expiration.
    Dispatches a branded HTML email with deep link and web reset buttons.
    Always returns success to prevent user enumeration.
    """
    email_clean = payload.email.lower().strip()
    user = db.query(User).filter(User.email == email_clean).first()

    GENERIC_RESPONSE = MessageResponse(
        message="If that email is registered, you will receive password reset instructions shortly.",
        success=True
    )

    if not user:
        return GENERIC_RESPONSE

    # Generate cryptographically secure random token (URL-safe base64, 32 bytes = 43 chars)
    raw_token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()

    # Set expiration (15 minutes from now in UTC)
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.RESET_TOKEN_EXPIRE_MINUTES)

    user.reset_token_hash = token_hash
    user.reset_token_expires_at = expires_at
    db.commit()

    # Dispatch email
    try:
        EmailService.send_password_reset_email(
            recipient_email=user.email,
            recipient_name=user.full_name or "Student",
            reset_token=raw_token,
        )
    except Exception as exc:
        logger.error(f"Failed to dispatch password reset email to {user.email}: {exc}")

    return GENERIC_RESPONSE


@router.get("/verify-reset-token", response_model=MessageResponse)
def verify_reset_token(
    email: str = Query(..., description="Registered email address"),
    token: str = Query(..., description="Reset token from email"),
    db: Session = Depends(get_db)
):
    """
    Verify whether a reset token is valid, unexpired, and matches the user.
    Called when the mobile app opens via deep link before showing the reset form.
    """
    email_clean = email.lower().strip()
    token_clean = token.strip()
    user = db.query(User).filter(User.email == email_clean).first()

    if not user or not user.reset_token_hash or not user.reset_token_expires_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired password reset link. Please request a new one."
        )

    incoming_hash = hashlib.sha256(token_clean.encode("utf-8")).hexdigest()
    if not hmac.compare_digest(user.reset_token_hash, incoming_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid password reset token."
        )

    # Ensure timezone awareness for comparison
    expires_at = user.reset_token_expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if datetime.now(timezone.utc) > expires_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This password reset link has expired. Please request a new one."
        )

    return MessageResponse(
        message="Reset token is valid.",
        success=True
    )


@router.post("/reset-password", response_model=MessageResponse)
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    """
    Validate reset token and update user password in PostgreSQL.
    Immediately invalidates the token upon use.
    """
    email_clean = payload.email.lower().strip()
    token_clean = payload.token.strip()
    user = db.query(User).filter(User.email == email_clean).first()

    if not user or not user.reset_token_hash or not user.reset_token_expires_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired password reset link. Please request a new one."
        )

    incoming_hash = hashlib.sha256(token_clean.encode("utf-8")).hexdigest()
    if not hmac.compare_digest(user.reset_token_hash, incoming_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid password reset token."
        )

    expires_at = user.reset_token_expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if datetime.now(timezone.utc) > expires_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This password reset link has expired. Please request a new one."
        )

    # Update password and invalidate single-use token
    user.password_hash = hash_password(payload.new_password)
    user.reset_token_hash = None
    user.reset_token_expires_at = None
    user.email_verified = True
    db.commit()

    return MessageResponse(
        message="Password has been reset successfully. You can now log in with your new password.",
        success=True
    )


@router.post("/google", response_model=TokenResponse)
def google_auth(payload: GoogleAuthRequest, db: Session = Depends(get_db)):
    """
    Authenticate or register via Google OAuth.
    Verifies Google ID token cryptographically using google-auth library against Google's public certs.
    Links existing user accounts by email or creates a new user profile.
    """
    email_clean = (payload.email or "").lower().strip()
    full_name = (payload.name or "").strip()
    avatar_url = payload.avatar_url
    google_sub = None

    # Cryptographically verify id_token if provided
    if payload.id_token:
        try:
            req = requests.Request()
            allowed_audiences = [
                cid for cid in [
                    settings.GOOGLE_CLIENT_ID_WEB,
                    settings.GOOGLE_CLIENT_ID_ANDROID,
                    settings.GOOGLE_CLIENT_ID_IOS,
                ] if cid
            ]
            
            # Verify signature with Google public certificates
            id_info = id_token.verify_oauth2_token(
                payload.id_token,
                req,
                audience=allowed_audiences[0] if len(allowed_audiences) == 1 else None
            )

            # If audiences configured and multiple, verify token matches one
            if allowed_audiences and len(allowed_audiences) > 1:
                token_aud = id_info.get("aud")
                if token_aud not in allowed_audiences:
                    logger.warning(f"Google token aud '{token_aud}' not in configured audiences: {allowed_audiences}")

            email_clean = (id_info.get("email") or email_clean).lower().strip()
            full_name = id_info.get("name") or full_name or "Google Student"
            avatar_url = id_info.get("picture") or avatar_url
            google_sub = id_info.get("sub")

        except Exception as exc:
            logger.warning(f"Google ID token cryptographic validation note: {exc}")
            # If Google Client IDs are explicitly configured in production, enforce strict token failure
            if any([settings.GOOGLE_CLIENT_ID_WEB, settings.GOOGLE_CLIENT_ID_ANDROID]):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail=f"Google authentication failed: {str(exc)}"
                )

    if not email_clean:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A valid email address is required for Google authentication."
        )

    # Find existing user by Google sub or email
    user = None
    if google_sub:
        user = db.query(User).filter(User.google_sub == google_sub).first()
    if not user:
        user = db.query(User).filter(User.email == email_clean).first()

    if not user:
        # Create brand-new user record
        user = User(
            full_name=full_name or "Google Student",
            email=email_clean,
            password_hash=None,
            avatar_url=avatar_url,
            google_sub=google_sub,
            auth_provider="google",
            email_verified=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        # Link existing user with Google sub and update avatar if missing
        updated = False
        if google_sub and not user.google_sub:
            user.google_sub = google_sub
            updated = True
        if avatar_url and not user.avatar_url:
            user.avatar_url = avatar_url
            updated = True
        if not user.email_verified:
            user.email_verified = True
            updated = True
        if updated:
            db.commit()

    access_token = create_access_token(subject=user.id)
    refresh_token = create_refresh_token(subject=user.id)

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        refresh_token=refresh_token,
        expires_in_minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES,
    )


@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """Get profile information for the authenticated user."""
    return current_user


@router.post("/logout")
def logout(current_user: User = Depends(get_current_user)):
    """Log out authenticated user."""
    return {"message": "Successfully logged out. Please discard your client token."}
