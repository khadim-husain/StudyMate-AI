import uuid

def test_health_check(client):
    """Test health endpoint returns 200 with database status connected."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["database"] == "connected"

def test_register_success(client):
    """Test registering a new student account."""
    email = f"alex_{uuid.uuid4().hex[:8]}@university.edu"
    response = client.post("/api/v1/auth/register", json={
        "full_name": "Alex Morgan",
        "email": email,
        "password": "password123"
    })
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == email
    assert data["full_name"] == "Alex Morgan"
    assert "password_hash" not in data
    assert "id" in data

def test_register_duplicate_email(client, test_user):
    """Test registering with an already existing email returns 409 Conflict."""
    response = client.post("/api/v1/auth/register", json={
        "full_name": "Another User",
        "email": test_user.email,
        "password": "password123"
    })
    assert response.status_code == 409
    assert "already exists" in response.json()["detail"]

def test_login_success(client, test_user):
    """Test logging in with valid credentials returns access token."""
    response = client.post("/api/v1/auth/login", json={
        "email": test_user.email,
        "password": "password123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["expires_in_minutes"] > 0

def test_login_invalid_password(client, test_user):
    """Test logging in with incorrect password returns 401."""
    response = client.post("/api/v1/auth/login", json={
        "email": test_user.email,
        "password": "wrong_password_99"
    })
    assert response.status_code == 401
    assert "Invalid email or password" in response.json()["detail"]

def test_get_current_user_profile(client, test_user, auth_headers):
    """Test getting current user profile with valid JWT."""
    response = client.get("/api/v1/auth/me", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == test_user.id
    assert data["email"] == test_user.email

def test_protected_endpoint_without_token(client):
    """Test accessing protected route without token returns 401."""
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401

def test_change_password_success_and_validation(client, auth_headers):
    """Test updating user password with verification of old password."""
    # 1. Wrong old password
    bad_res = client.post(
        "/api/v1/users/change-password",
        json={"current_password": "wrongpassword", "new_password": "newpassword123"},
        headers=auth_headers
    )
    assert bad_res.status_code == 400

    # 2. Correct old password
    ok_res = client.post(
        "/api/v1/users/change-password",
        json={"current_password": "password123", "new_password": "newpassword123"},
        headers=auth_headers
    )
    assert ok_res.status_code == 200
    assert "successfully" in ok_res.json()["message"]

def test_google_auth_new_and_existing_user(client):
    """Test Google OAuth authentication creates new user or signs in existing user."""
    google_email = f"googlestudent_{uuid.uuid4().hex[:6]}@gmail.com"

    # 1. New user registration via Google
    res1 = client.post("/api/v1/auth/google", json={
        "email": google_email,
        "name": "Google Test Student",
        "avatar_url": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200"
    })
    assert res1.status_code == 200
    data1 = res1.json()
    assert "access_token" in data1
    assert data1["token_type"] == "bearer"

    # 2. Existing user login via Google
    res2 = client.post("/api/v1/auth/google", json={
        "email": google_email,
        "name": "Google Test Student"
    })
    assert res2.status_code == 200
    data2 = res2.json()
    assert "access_token" in data2

