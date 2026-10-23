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
