from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse, RefreshTokenRequest
from app.schemas.user import UserResponse
from app.schemas.document import DocumentResponse, DocumentStatusResponse
from app.schemas.chat import ConversationCreate, ConversationResponse, MessageCreate, MessageResponse
from app.schemas.summary import SummaryCreate, SummaryResponse
from app.schemas.quiz import QuizGenerateRequest, QuizResponse, QuizSubmitRequest, QuizAttemptResponse
from app.schemas.flashcard import FlashcardGenerateRequest, FlashcardResponse, FlashcardReviewRequest
from app.schemas.task import TaskCreate, TaskUpdate, TaskResponse
from app.schemas.analytics import DashboardStatsResponse, AnalyticsOverviewResponse

__all__ = [
    "RegisterRequest",
    "LoginRequest",
    "TokenResponse",
    "RefreshTokenRequest",
    "UserResponse",
    "DocumentResponse",
    "DocumentStatusResponse",
    "ConversationCreate",
    "ConversationResponse",
    "MessageCreate",
    "MessageResponse",
    "SummaryCreate",
    "SummaryResponse",
    "QuizGenerateRequest",
    "QuizResponse",
    "QuizSubmitRequest",
    "QuizAttemptResponse",
    "FlashcardGenerateRequest",
    "FlashcardResponse",
    "FlashcardReviewRequest",
    "TaskCreate",
    "TaskUpdate",
    "TaskResponse",
    "DashboardStatsResponse",
    "AnalyticsOverviewResponse",
]
