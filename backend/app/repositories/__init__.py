from typing import Optional
from sqlalchemy.orm import Session
from app.repositories.base import BaseRepository
from app.models.user import User
from app.models.document import Document
from app.models.chat import Conversation, ChatMessage
from app.models.task import StudyTask
from app.models.quiz import Quiz
from app.models.flashcard import Flashcard
from app.models.summary import Summary

class UserRepository(BaseRepository[User]):
    def __init__(self):
        super().__init__(User)

    def get_by_email(self, db: Session, email: str) -> Optional[User]:
        return db.query(User).filter(User.email == email.lower()).first()

class DocumentRepository(BaseRepository[Document]):
    def __init__(self):
        super().__init__(Document)

class ChatRepository(BaseRepository[Conversation]):
    def __init__(self):
        super().__init__(Conversation)

class TaskRepository(BaseRepository[StudyTask]):
    def __init__(self):
        super().__init__(StudyTask)

class QuizRepository(BaseRepository[Quiz]):
    def __init__(self):
        super().__init__(Quiz)

class FlashcardRepository(BaseRepository[Flashcard]):
    def __init__(self):
        super().__init__(Flashcard)

class SummaryRepository(BaseRepository[Summary]):
    def __init__(self):
        super().__init__(Summary)

user_repo = UserRepository()
document_repo = DocumentRepository()
chat_repo = ChatRepository()
task_repo = TaskRepository()
quiz_repo = QuizRepository()
flashcard_repo = FlashcardRepository()
summary_repo = SummaryRepository()
