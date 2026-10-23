from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.document import Document
from app.models.chunk import DocumentChunk
from app.models.flashcard import Flashcard
from app.schemas.flashcard import (
    FlashcardGenerateRequest,
    FlashcardResponse,
    FlashcardCreate,
    FlashcardUpdate,
    FlashcardReviewRequest
)
from app.ai.gemini_service import gemini_service

router = APIRouter(prefix="/flashcards", tags=["Flashcards"])

@router.post("/generate", response_model=List[FlashcardResponse], status_code=status.HTTP_201_CREATED)
def generate_flashcards(
    payload: FlashcardGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate spaced repetition flashcards from a document or topic."""
    source_text = ""
    topic_name = payload.topic or "Key Exam Concepts"

    if payload.document_id:
        doc = db.query(Document).filter(Document.id == payload.document_id, Document.user_id == current_user.id).first()
        if not doc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")
        topic_name = doc.filename
        chunks = db.query(DocumentChunk).filter(DocumentChunk.document_id == doc.id).all()
        source_text = "\n\n".join(c.content for c in chunks[:15])

    raw_cards = gemini_service.generate_flashcards(
        topic=topic_name,
        text_content=source_text,
        num_cards=payload.num_cards
    )

    created_cards = []
    for card_data in raw_cards:
        fc = Flashcard(
            user_id=current_user.id,
            document_id=payload.document_id,
            question=card_data["question"],
            answer=card_data["answer"],
            review_status="new"
        )
        db.add(fc)
        created_cards.append(fc)

    db.commit()
    for fc in created_cards:
        db.refresh(fc)

    return created_cards

@router.get("", response_model=List[FlashcardResponse])
def list_flashcards(
    document_id: Optional[str] = None,
    review_status: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List flashcards belonging to the authenticated user."""
    q = db.query(Flashcard).filter(Flashcard.user_id == current_user.id)
    if document_id:
        q = q.filter(Flashcard.document_id == document_id)
    if review_status:
        q = q.filter(Flashcard.review_status == review_status)

    return q.order_by(Flashcard.created_at.desc()).offset(skip).limit(limit).all()

@router.get("/{flashcard_id}", response_model=FlashcardResponse)
def get_flashcard(
    flashcard_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get single flashcard by ID."""
    fc = db.query(Flashcard).filter(Flashcard.id == flashcard_id, Flashcard.user_id == current_user.id).first()
    if not fc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Flashcard not found.")
    return fc

@router.patch("/{flashcard_id}", response_model=FlashcardResponse)
def update_flashcard(
    flashcard_id: str,
    payload: FlashcardUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update flashcard question, answer, or status."""
    fc = db.query(Flashcard).filter(Flashcard.id == flashcard_id, Flashcard.user_id == current_user.id).first()
    if not fc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Flashcard not found.")

    if payload.question is not None:
        fc.question = payload.question
    if payload.answer is not None:
        fc.answer = payload.answer
    if payload.review_status is not None:
        fc.review_status = payload.review_status

    db.commit()
    db.refresh(fc)
    return fc

@router.post("/{flashcard_id}/review", response_model=FlashcardResponse)
def review_flashcard(
    flashcard_id: str,
    payload: FlashcardReviewRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark flashcard as Known or Review Again (updates spaced repetition status)."""
    fc = db.query(Flashcard).filter(Flashcard.id == flashcard_id, Flashcard.user_id == current_user.id).first()
    if not fc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Flashcard not found.")

    if payload.is_known:
        fc.review_status = "mastered" if fc.review_status == "known" else "known"
    else:
        fc.review_status = "review"

    db.commit()
    db.refresh(fc)
    return fc

@router.delete("/{flashcard_id}")
def delete_flashcard(
    flashcard_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a flashcard."""
    fc = db.query(Flashcard).filter(Flashcard.id == flashcard_id, Flashcard.user_id == current_user.id).first()
    if not fc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Flashcard not found.")

    db.delete(fc)
    db.commit()
    return {"message": "Flashcard deleted successfully."}
