from typing import Generic, TypeVar, Type, Optional, List
from sqlalchemy.orm import Session
from app.db.base import Base

ModelType = TypeVar("ModelType", bound=Base)

class BaseRepository(Generic[ModelType]):
    def __init__(self, model: Type[ModelType]):
        self.model = model

    def get(self, db: Session, id: str) -> Optional[ModelType]:
        return db.query(self.model).filter(self.model.id == id).first()

    def get_by_user(self, db: Session, user_id: str, skip: int = 0, limit: int = 50) -> List[ModelType]:
        if hasattr(self.model, "user_id"):
            return db.query(self.model).filter(self.model.user_id == user_id).offset(skip).limit(limit).all()
        return []

    def create(self, db: Session, obj_in: ModelType) -> ModelType:
        db.add(obj_in)
        db.commit()
        db.refresh(obj_in)
        return obj_in

    def delete(self, db: Session, id: str) -> bool:
        obj = self.get(db, id)
        if obj:
            db.delete(obj)
            db.commit()
            return True
        return False
