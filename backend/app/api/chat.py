from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.chat import Conversation, ChatMessage
from app.schemas.chat import (
    ConversationCreate,
    ConversationResponse,
    ConversationDetailResponse,
    MessageCreate,
    MessageResponse
)
from app.rag.pipeline import rag_pipeline

router = APIRouter(prefix="/chat", tags=["AI Chat"])

@router.post("/conversations", response_model=ConversationResponse, status_code=status.HTTP_201_CREATED)
def create_conversation(
    payload: ConversationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Start a new AI study conversation."""
    conversation = Conversation(
        user_id=current_user.id,
        title=payload.title or "New Study Session"
    )
    db.add(conversation)
    db.commit()
    db.refresh(conversation)

    return ConversationResponse(
        id=conversation.id,
        user_id=conversation.user_id,
        title=conversation.title,
        created_at=conversation.created_at,
        updated_at=conversation.updated_at,
        messages_count=0
    )

@router.get("/conversations", response_model=List[ConversationResponse])
def list_conversations(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List previous conversations for the authenticated user."""
    convs = (
        db.query(Conversation)
        .filter(Conversation.user_id == current_user.id)
        .order_by(Conversation.updated_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    results = []
    for c in convs:
        msg_count = db.query(ChatMessage).filter(ChatMessage.conversation_id == c.id).count()
        last_msg = (
            db.query(ChatMessage)
            .filter(ChatMessage.conversation_id == c.id)
            .order_by(ChatMessage.created_at.desc())
            .first()
        )
        results.append(ConversationResponse(
            id=c.id,
            user_id=c.user_id,
            title=c.title,
            created_at=c.created_at,
            updated_at=c.updated_at,
            messages_count=msg_count,
            last_message=last_msg.content[:80] + "..." if last_msg else None
        ))
    return results

@router.get("/conversations/{conversation_id}", response_model=ConversationDetailResponse)
def get_conversation(
    conversation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get conversation and full chat history."""
    conv = (
        db.query(Conversation)
        .filter(Conversation.id == conversation_id, Conversation.user_id == current_user.id)
        .first()
    )
    if not conv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found.")

    messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.conversation_id == conv.id)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )

    return ConversationDetailResponse(
        id=conv.id,
        user_id=conv.user_id,
        title=conv.title,
        created_at=conv.created_at,
        updated_at=conv.updated_at,
        messages_count=len(messages),
        messages=[MessageResponse.model_validate(m) for m in messages]
    )

@router.post("/conversations/{conversation_id}/messages", response_model=MessageResponse)
def send_message(
    conversation_id: str,
    payload: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Post a question to the AI tutor and receive a document-grounded answer with source citations."""
    conv = (
        db.query(Conversation)
        .filter(Conversation.id == conversation_id, Conversation.user_id == current_user.id)
        .first()
    )
    if not conv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found.")

    # 1. Save student's user message
    user_msg = ChatMessage(
        conversation_id=conv.id,
        user_id=current_user.id,
        role="user",
        content=payload.content.strip()
    )
    db.add(user_msg)
    db.commit()

    # 2. Run RAG Pipeline
    rag_result = rag_pipeline.answer_question(
        db=db,
        user_id=current_user.id,
        question=payload.content.strip(),
        document_ids=payload.document_ids
    )

    # 3. Save AI response message with citations
    ai_msg = ChatMessage(
        conversation_id=conv.id,
        user_id=current_user.id,
        role="assistant",
        content=rag_result["content"],
        citations=rag_result.get("citations", [])
    )
    db.add(ai_msg)

    # Update conversation title if first message
    if conv.title == "New Study Session":
        conv.title = payload.content.strip()[:40] + ("..." if len(payload.content) > 40 else "")

    db.commit()
    db.refresh(ai_msg)

    return ai_msg

@router.delete("/conversations/{conversation_id}")
def delete_conversation(
    conversation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a conversation and all its messages."""
    conv = (
        db.query(Conversation)
        .filter(Conversation.id == conversation_id, Conversation.user_id == current_user.id)
        .first()
    )
    if not conv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found.")

    db.delete(conv)
    db.commit()
    return {"message": "Conversation deleted successfully."}
