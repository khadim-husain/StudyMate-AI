import os
import sys

# Ensure backend root is in python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
import secrets
import hashlib
from datetime import datetime, timedelta, timezone
from fastapi.testclient import TestClient
from app.main import app
from app.db.session import SessionLocal
from app.models.user import User
from app.core.security import hash_password

client = TestClient(app)

def test_forgot_password_and_reset_flow():
    db = SessionLocal()
    test_email = f"reset_test_{secrets.token_hex(4)}@university.edu"
    initial_password = "InitialPassword123!"
    new_password = "BrandNewPassword456!"

    try:
        # 1. Create a test user
        user = User(
            full_name="Reset Tester",
            email=test_email,
            password_hash=hash_password(initial_password),
            auth_provider="local"
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        # 2. Test forgot-password endpoint for existing user
        resp = client.post("/api/v1/auth/forgot-password", json={"email": test_email})
        assert resp.status_code == 200
        assert resp.json()["success"] is True

        # Refresh user from DB to check token was saved
        db.refresh(user)
        assert user.reset_token_hash is not None
        assert user.reset_token_expires_at is not None

        # 3. Test forgot-password endpoint for non-existing user (prevents enumeration)
        fake_email = "nonexistent_student_999@randomdomain.xyz"
        resp_fake = client.post("/api/v1/auth/forgot-password", json={"email": fake_email})
        assert resp_fake.status_code == 200
        assert resp_fake.json()["success"] is True

        # 4. Generate a known raw token and test verification & reset
        raw_token = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
        user.reset_token_hash = token_hash
        user.reset_token_expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)
        db.commit()

        # 5. Verify token with valid token
        verify_resp = client.get(f"/api/v1/auth/verify-reset-token?email={test_email}&token={raw_token}")
        assert verify_resp.status_code == 200
        assert verify_resp.json()["success"] is True

        # 6. Verify token with INVALID token
        invalid_verify = client.get(f"/api/v1/auth/verify-reset-token?email={test_email}&token=wrongtoken123")
        assert invalid_verify.status_code == 400

        # 7. Perform Reset Password with valid token
        reset_resp = client.post("/api/v1/auth/reset-password", json={
            "email": test_email,
            "token": raw_token,
            "new_password": new_password
        })
        assert reset_resp.status_code == 200
        assert reset_resp.json()["success"] is True

        # 8. Token must now be invalidated (single-use)
        db.refresh(user)
        assert user.reset_token_hash is None
        assert user.reset_token_expires_at is None

        # Re-using the same token must fail
        reuse_resp = client.post("/api/v1/auth/reset-password", json={
            "email": test_email,
            "token": raw_token,
            "new_password": "AnotherPassword789!"
        })
        assert reuse_resp.status_code == 400

        # 9. Login with OLD password must fail
        old_login_resp = client.post("/api/v1/auth/login", json={
            "email": test_email,
            "password": initial_password
        })
        assert old_login_resp.status_code == 401

        # 10. Login with NEW password must succeed
        new_login_resp = client.post("/api/v1/auth/login", json={
            "email": test_email,
            "password": new_password
        })
        assert new_login_resp.status_code == 200
        assert "access_token" in new_login_resp.json()

        print("PASSWORD RESET FLOW TEST PASSED COMPLETELY!")

    finally:
        # Cleanup
        db.query(User).filter(User.email == test_email).delete()
        db.commit()
        db.close()

def test_google_auth_flow():
    db = SessionLocal()
    test_google_email = f"google_test_{secrets.token_hex(4)}@university.edu"

    try:
        # Test creating new user via Google
        resp = client.post("/api/v1/auth/google", json={
            "email": test_google_email,
            "name": "Google Test Student",
            "avatar_url": "https://lh3.googleusercontent.com/test_avatar"
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert "refresh_token" in data

        # Verify user was saved in DB with auth_provider google
        user = db.query(User).filter(User.email == test_google_email).first()
        assert user is not None
        assert user.full_name == "Google Test Student"
        assert user.auth_provider == "google"
        assert user.email_verified is True

        # Test subsequent login with same Google account
        resp_subsequent = client.post("/api/v1/auth/google", json={
            "email": test_google_email,
            "name": "Google Test Student"
        })
        assert resp_subsequent.status_code == 200
        assert "access_token" in resp_subsequent.json()

        print("GOOGLE AUTH FLOW TEST PASSED COMPLETELY!")

    finally:
        # Cleanup
        db.query(User).filter(User.email == test_google_email).delete()
        db.commit()
        db.close()

if __name__ == "__main__":
    test_forgot_password_and_reset_flow()
    test_google_auth_flow()
