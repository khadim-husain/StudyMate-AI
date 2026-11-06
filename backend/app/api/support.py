from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.support import SupportTicket
from app.schemas.support import SupportTicketCreate, SupportTicketResponse

router = APIRouter(prefix="/support", tags=["Support & Help"])

@router.post("/tickets", response_model=SupportTicketResponse, status_code=status.HTTP_201_CREATED)
def create_support_ticket(
    payload: SupportTicketCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Submit a real user support inquiry or problem report."""
    ticket = SupportTicket(
        user_id=current_user.id,
        subject=payload.subject.strip(),
        category=payload.category.strip(),
        description=payload.description.strip(),
        status="open"
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    return ticket

@router.get("/tickets", response_model=List[SupportTicketResponse])
def get_user_support_tickets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve history of support requests submitted by the authenticated user."""
    return db.query(SupportTicket).filter(
        SupportTicket.user_id == current_user.id
    ).order_by(SupportTicket.created_at.desc()).all()

