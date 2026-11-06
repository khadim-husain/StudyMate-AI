import io
import uuid
import pytest
from fastapi.testclient import TestClient

def get_auth_header(client: TestClient, email: str, password: str = "Password123!"):
    login_res = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_profile_update_and_duplicate_email(client: TestClient):
    uid1 = uuid.uuid4().hex[:8]
    email1 = f"user_{uid1}@example.com"
    r1 = client.post("/api/v1/auth/register", json={
        "full_name": "Original User",
        "email": email1,
        "password": "Password123!"
    })
    assert r1.status_code == 201
    headers1 = get_auth_header(client, email1)

    # Register user 2
    uid2 = uuid.uuid4().hex[:8]
    email2 = f"user_{uid2}@example.com"
    r2 = client.post("/api/v1/auth/register", json={
        "full_name": "Second User",
        "email": email2,
        "password": "Password123!"
    })
    assert r2.status_code == 201

    # Update profile name for user 1
    update_res = client.patch("/api/v1/users/me", headers=headers1, json={
        "full_name": "Updated Name"
    })
    assert update_res.status_code == 200
    assert update_res.json()["full_name"] == "Updated Name"

    # Attempt to change user 1's email to user 2's email (duplicate)
    dup_res = client.patch("/api/v1/users/me", headers=headers1, json={
        "email": email2
    })
    assert dup_res.status_code == 400
    assert "already in use" in dup_res.json()["detail"]

def test_avatar_upload(client: TestClient):
    uid = uuid.uuid4().hex[:8]
    email = f"avatar_{uid}@example.com"
    reg = client.post("/api/v1/auth/register", json={
        "full_name": "Avatar User",
        "email": email,
        "password": "Password123!"
    })
    assert reg.status_code == 201
    headers = get_auth_header(client, email)

    # Create dummy PNG image bytes
    fake_png = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4"
    files = {"file": ("avatar.png", io.BytesIO(fake_png), "image/png")}

    res = client.post("/api/v1/users/avatar", headers=headers, files=files)
    assert res.status_code == 200
    data = res.json()
    assert data["avatar_url"] is not None
    assert "/uploads/avatars/" in data["avatar_url"]

def test_user_preferences_lifecycle(client: TestClient):
    uid = uuid.uuid4().hex[:8]
    email = f"prefs_{uid}@example.com"
    reg = client.post("/api/v1/auth/register", json={
        "full_name": "Prefs User",
        "email": email,
        "password": "Password123!"
    })
    assert reg.status_code == 201
    headers = get_auth_header(client, email)

    # GET default preferences
    get_res = client.get("/api/v1/users/preferences", headers=headers)
    assert get_res.status_code == 200
    prefs = get_res.json()
    assert prefs["theme"] == "system"
    assert prefs["notifications_enabled"] is True

    # PUT updated preferences
    put_res = client.put("/api/v1/users/preferences", headers=headers, json={
        "theme": "dark",
        "language": "es",
        "quiz_reminders": False
    })
    assert put_res.status_code == 200
    updated = put_res.json()
    assert updated["theme"] == "dark"
    assert updated["language"] == "es"
    assert updated["quiz_reminders"] is False
    assert updated["study_reminders"] is True

def test_support_ticket_submission_and_retrieval(client: TestClient):
    uid = uuid.uuid4().hex[:8]
    email = f"support_{uid}@example.com"
    reg = client.post("/api/v1/auth/register", json={
        "full_name": "Support User",
        "email": email,
        "password": "Password123!"
    })
    assert reg.status_code == 201
    headers = get_auth_header(client, email)

    # Submit ticket
    ticket_res = client.post("/api/v1/support/tickets", headers=headers, json={
        "subject": "PDF Upload timeout inquiry",
        "category": "documents",
        "description": "How large can textbooks be before indexing takes more than a minute?"
    })
    assert ticket_res.status_code == 201
    ticket = ticket_res.json()
    assert ticket["id"] is not None
    assert ticket["status"] == "open"

    # Get tickets
    list_res = client.get("/api/v1/support/tickets", headers=headers)
    assert list_res.status_code == 200
    tickets = list_res.json()
    assert len(tickets) >= 1
    assert tickets[0]["subject"] == "PDF Upload timeout inquiry"
