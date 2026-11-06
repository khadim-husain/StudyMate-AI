import uuid
from sqlalchemy import String, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin

class UserPreference(Base, TimestampMixin):
    __tablename__ = "user_preferences"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True, nullable=False)

    notifications_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    study_reminders: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    task_deadline_reminders: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    quiz_reminders: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    daily_study_goals: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    doc_processing_notifications: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    theme: Mapped[str] = mapped_column(String(20), default="system", nullable=False)
    language: Mapped[str] = mapped_column(String(10), default="en", nullable=False)

    # Relationship
    user = relationship("User", back_populates="preferences")

