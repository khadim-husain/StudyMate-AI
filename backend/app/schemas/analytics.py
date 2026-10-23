from pydantic import BaseModel
from typing import List, Dict, Any

class SubjectProgress(BaseModel):
    subject: str
    documents_count: int
    tasks_count: int
    completed_tasks_count: int
    mastery_percent: int

class DashboardStatsResponse(BaseModel):
    total_documents: int
    total_tasks: int
    completed_tasks: int
    pending_tasks: int
    total_quizzes: int
    average_quiz_score: float
    total_flashcards: int
    mastered_flashcards: int
    study_streak_days: int = 1

class DailyActivity(BaseModel):
    day: str
    hours: float

class AnalyticsOverviewResponse(BaseModel):
    dashboard_stats: DashboardStatsResponse
    subjects: List[SubjectProgress]
    weekly_activity: List[DailyActivity]
