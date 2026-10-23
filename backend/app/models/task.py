import uuid
from typing import Optional
from datetime import datetime, timezone
from sqlalchemy import String, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin

class StudyTask(Base, TimestampMixin):
    __tablename__ = "study_tasks"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    subject: Mapped[str] = mapped_column(String(100), default="General Study", nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)
    priority: Mapped[str] = mapped_column(String(20), default="Medium", nullable=False) # 'Low', 'Medium', 'High'
    due_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    completed: Mapped[bool] = mapped_column(Boolean, default=False, index=True, nullable=False)

    # Relationships
    user = relationship("User", back_populates="tasks")
