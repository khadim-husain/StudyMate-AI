from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.document import Document
from app.models.chunk import DocumentChunk
from app.models.summary import Summary
from app.schemas.summary import SummaryCreate, SummaryResponse
from app.ai.gemini_service import gemini_service

router = APIRouter(tags=["AI Summaries"])

@router.post("/documents/{document_id}/summaries", response_model=SummaryResponse, status_code=status.HTTP_201_CREATED)
def generate_document_summary(
    document_id: str,
    payload: SummaryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate an AI summary with key concepts and revision notes for a document."""
    doc = db.query(Document).filter(Document.id == document_id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")

    # Retrieve all chunks for this document
    chunks = db.query(DocumentChunk).filter(DocumentChunk.document_id == doc.id).order_by(DocumentChunk.chunk_index.asc()).all()
    if not chunks:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Document has no extracted text to summarize.")

    combined_text = "\n\n".join(c.content for c in chunks[:25]) # up to first 25 chunks

    ai_result = gemini_service.generate_summary(
        doc_title=doc.filename,
        text_content=combined_text,
        summary_type=payload.summary_type
    )

    summary = Summary(
        user_id=current_user.id,
        document_id=doc.id,
        summary_type=payload.summary_type,
        content=ai_result["summary"],
        key_concepts=ai_result.get("key_concepts", []),
        revision_notes=ai_result.get("revision_notes", [])
    )
    db.add(summary)
    db.commit()
    db.refresh(summary)

    return summary

@router.get("/documents/{document_id}/summaries", response_model=List[SummaryResponse])
def list_document_summaries(
    document_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all AI summaries generated for a document."""
    doc = db.query(Document).filter(Document.id == document_id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")

    return db.query(Summary).filter(Summary.document_id == doc.id).order_by(Summary.created_at.desc()).all()

@router.get("/summaries/{summary_id}", response_model=SummaryResponse)
def get_summary(
    summary_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific summary by ID."""
    summary = db.query(Summary).filter(Summary.id == summary_id, Summary.user_id == current_user.id).first()
    if not summary:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Summary not found.")
    return summary

@router.delete("/summaries/{summary_id}")
def delete_summary(
    summary_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a summary."""
    summary = db.query(Summary).filter(Summary.id == summary_id, Summary.user_id == current_user.id).first()
    if not summary:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Summary not found.")
    db.delete(summary)
    db.commit()
    return {"message": "Summary deleted successfully."}
