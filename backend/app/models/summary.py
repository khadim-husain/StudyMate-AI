import uuid
from typing import Optional, List
from datetime import datetime, timezone
from sqlalchemy import String, Text, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

class Summary(Base):
    __tablename__ = "summaries"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    document_id: Mapped[str] = mapped_column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), index=True, nullable=False)
    summary_type: Mapped[str] = mapped_column(String(30), default="medium", nullable=False) # 'short', 'medium', 'detailed'
    content: Mapped[str] = mapped_column(Text, nullable=False)
    key_concepts: Mapped[Optional[List[str]]] = mapped_column(JSONB, default=list, nullable=True)
    revision_notes: Mapped[Optional[List[str]]] = mapped_column(JSONB, default=list, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # Relationships
    user = relationship("User", back_populates="summaries")
    document = relationship("Document", back_populates="summaries")
