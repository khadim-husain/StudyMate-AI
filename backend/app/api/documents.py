import os
import uuid
import shutil
from typing import List, Optional
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status, Query, BackgroundTasks
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.core.config import settings
from app.models.user import User
from app.models.document import Document
from app.models.chunk import DocumentChunk
from app.schemas.document import DocumentResponse, DocumentStatusResponse, DocumentDetailResponse
from app.rag.ingestion import ingestion_service
from app.services.storage_service import storage_service

router = APIRouter(prefix="/documents", tags=["Documents"])

@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Upload a study PDF, validate file headers, and trigger ingestion."""
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF documents (.pdf) are supported."
        )

    # Generate safe server-side storage filename
    safe_filename = f"{current_user.id}_{uuid.uuid4().hex[:12]}_{os.path.basename(file.filename)}"

    # Read uploaded file while monitoring max size
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    file_bytes = await file.read()
    if len(file_bytes) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_MB}MB."
        )

    # Save via unified storage service (S3/R2 Cloud Object Storage or local disk fallback)
    storage_path = storage_service.save_file(file_bytes, safe_filename, content_type="application/pdf")

    # Create document record in database
    doc = Document(
        user_id=current_user.id,
        filename=file.filename,
        storage_path=storage_path,
        file_size=len(file_bytes),
        page_count=0,
        processing_status="pending"
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    # Process immediately or via background task
    # For responsiveness and fast retrieval readiness, process right away
    ingestion_service.process_document(db, doc.id)
    db.refresh(doc)

    return doc

@router.get("", response_model=List[DocumentResponse])
def list_documents(
    search: Optional[str] = Query(None, description="Filter documents by filename"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List documents belonging to the authenticated user."""
    q = db.query(Document).filter(Document.user_id == current_user.id)
    if search:
        q = q.filter(Document.filename.ilike(f"%{search.strip()}%"))
    return q.order_by(Document.created_at.desc()).offset(skip).limit(limit).all()

@router.get("/{document_id}", response_model=DocumentDetailResponse)
def get_document(
    document_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get document details and extracted chunk count."""
    doc = db.query(Document).filter(Document.id == document_id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")

    chunk_count = db.query(DocumentChunk).filter(DocumentChunk.document_id == doc.id).count()
    return DocumentDetailResponse(
        id=doc.id,
        user_id=doc.user_id,
        filename=doc.filename,
        file_size=doc.file_size,
        page_count=doc.page_count,
        processing_status=doc.processing_status,
        processing_error=doc.processing_error,
        created_at=doc.created_at,
        updated_at=doc.updated_at,
        extracted_chunks_count=chunk_count
    )

@router.get("/{document_id}/status", response_model=DocumentStatusResponse)
def get_document_status(
    document_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Check processing status of a document."""
    doc = db.query(Document).filter(Document.id == document_id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")

    chunk_count = db.query(DocumentChunk).filter(DocumentChunk.document_id == doc.id).count()
    return DocumentStatusResponse(
        id=doc.id,
        filename=doc.filename,
        processing_status=doc.processing_status,
        processing_error=doc.processing_error,
        page_count=doc.page_count,
        chunk_count=chunk_count
    )

@router.get("/{document_id}/chunks")
def get_document_chunks(
    document_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get extracted text chunks with page numbers and previews."""
    doc = db.query(Document).filter(Document.id == document_id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")

    chunks = db.query(DocumentChunk).filter(DocumentChunk.document_id == doc.id).order_by(DocumentChunk.chunk_index.asc()).all()
    return [
        {
            "id": c.id,
            "chunk_index": c.chunk_index,
            "page_number": c.page_number,
            "content": c.content,
            "token_count": c.token_count
        }
        for c in chunks
    ]

@router.delete("/{document_id}", status_code=status.HTTP_200_OK)
def delete_document(
    document_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a document and clean up physical storage and associated database records."""
    doc = db.query(Document).filter(Document.id == document_id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")

    # Remove file from cloud object storage or local disk
    storage_service.delete_file(doc.storage_path)

    db.delete(doc)
    db.commit()
    return {"message": f"Document '{doc.filename}' and associated chunks deleted successfully."}
