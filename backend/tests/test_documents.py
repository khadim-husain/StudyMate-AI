import io
import pymupdf as fitz
from app.models.document import Document

def create_sample_pdf_bytes(text_content: str = "Backpropagation evaluates partial derivatives via the chain rule.") -> bytes:
    """Helper to generate a real, valid PDF in memory using PyMuPDF."""
    doc = fitz.open()
    page = doc.new_page()
    page.insert_text((50, 72), text_content)
    pdf_bytes = doc.write()
    doc.close()
    return pdf_bytes

def test_upload_non_pdf_rejected(client, auth_headers):
    """Test uploading a file without .pdf extension returns 400 Bad Request."""
    file_content = b"Plain text file content"
    files = {"file": ("test.txt", io.BytesIO(file_content), "text/plain")}
    response = client.post("/api/v1/documents/upload", headers=auth_headers, files=files)
    assert response.status_code == 400
    assert "Only PDF documents (.pdf) are supported" in response.json()["detail"]

def test_upload_and_process_pdf(client, auth_headers):
    """Test uploading a valid PDF: parses pages, chunks content, generates embeddings, status completed."""
    sample_text = (
        "Artificial Intelligence: Neural Networks and Deep Learning.\n"
        "Gradient descent minimizes empirical loss across training batches.\n"
        "AdamW decouples weight decay from historical gradient moments."
    )
    pdf_bytes = create_sample_pdf_bytes(sample_text)
    files = {"file": ("Machine_Learning_Lecture.pdf", io.BytesIO(pdf_bytes), "application/pdf")}

    response = client.post("/api/v1/documents/upload", headers=auth_headers, files=files)
    assert response.status_code == 201
    data = response.json()
    assert data["filename"] == "Machine_Learning_Lecture.pdf"
    assert data["processing_status"] == "completed"
    assert data["page_count"] == 1
    doc_id = data["id"]

    # Check status endpoint
    status_resp = client.get(f"/api/v1/documents/{doc_id}/status", headers=auth_headers)
    assert status_resp.status_code == 200
    status_data = status_resp.json()
    assert status_data["processing_status"] == "completed"
    assert status_data["chunk_count"] >= 1

    # Check list documents
    list_resp = client.get("/api/v1/documents", headers=auth_headers)
    assert list_resp.status_code == 200
    docs = list_resp.json()
    assert any(d["id"] == doc_id for d in docs)

    # Check delete document
    del_resp = client.delete(f"/api/v1/documents/{doc_id}", headers=auth_headers)
    assert del_resp.status_code == 200

    # Ensure document is gone
    get_again = client.get(f"/api/v1/documents/{doc_id}", headers=auth_headers)
    assert get_again.status_code == 404

def test_cross_user_document_isolation(client, auth_headers, test_user, db_session):
    """Ensure user A cannot access or delete documents belonging to user B."""
    import uuid
    from app.models.user import User
    from app.core.security import hash_password, create_access_token

    # Create User B
    user_b = User(
        full_name="User B",
        email=f"user_b_{uuid.uuid4().hex[:6]}@edu.com",
        password_hash=hash_password("password123")
    )
    db_session.add(user_b)
    db_session.commit()
    token_b = create_access_token(subject=user_b.id)
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # Upload document as User A
    pdf_bytes = create_sample_pdf_bytes("User A Confidential Notes")
    files = {"file": ("confidential.pdf", io.BytesIO(pdf_bytes), "application/pdf")}
    resp_a = client.post("/api/v1/documents/upload", headers=auth_headers, files=files)
    doc_id_a = resp_a.json()["id"]

    # Attempt to read as User B -> must return 404
    resp_b_get = client.get(f"/api/v1/documents/{doc_id_a}", headers=headers_b)
    assert resp_b_get.status_code == 404

    # Attempt to delete as User B -> must return 404
    resp_b_del = client.delete(f"/api/v1/documents/{doc_id_a}", headers=headers_b)
    assert resp_b_del.status_code == 404
