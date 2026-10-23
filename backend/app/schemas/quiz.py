from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import List, Optional, Dict, Any

class QuizGenerateRequest(BaseModel):
    document_id: Optional[str] = None
    topic: Optional[str] = "Key Coursework Concepts"
    num_questions: int = Field(default=5, ge=1, le=20)
    difficulty: str = Field(default="medium", pattern="^(easy|medium|hard)$")

class QuizQuestionClientResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    question: str
    options: List[str]

class QuizQuestionFullResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    question: str
    options: List[str]
    correct_answer: int
    explanation: str

class QuizResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    document_id: Optional[str]
    title: str
    difficulty: str
    created_at: datetime
    questions: List[QuizQuestionClientResponse] = []

class QuizSubmitRequest(BaseModel):
    answers: Dict[str, int] = Field(..., description="Mapping of question_id to selected option index (0..3)")

class QuestionGradedResult(BaseModel):
    question_id: str
    question: str
    options: List[str]
    selected_option: Optional[int]
    correct_option: int
    is_correct: bool
    explanation: str

class QuizAttemptResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    quiz_id: str
    user_id: str
    score: int
    total_questions: int
    percentage: int
    submitted_at: datetime
    results: Optional[List[QuestionGradedResult]] = None
