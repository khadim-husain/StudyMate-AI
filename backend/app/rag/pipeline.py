from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.rag.retrieval import VectorRetriever
from app.ai.gemini_service import gemini_service
from app.models.document import Document

class RAGPipeline:
    @staticmethod
    def answer_question(
        db: Session,
        user_id: str,
        question: str,
        document_ids: Optional[List[str]] = None,
        top_k: int = 5
    ) -> Dict[str, Any]:
        """Execute full RAG pipeline: retrieve relevant chunks, prompt Gemini with evidence, return answer with citations."""
        # Validate that document_ids belong to the user if provided
        if document_ids:
            user_docs = db.query(Document.id).filter(
                Document.id.in_(document_ids),
                Document.user_id == user_id
            ).all()
            valid_doc_ids = [d[0] for d in user_docs]
        else:
            valid_doc_ids = None

        # 1. Retrieve evidence
        retrieved_chunks = VectorRetriever.retrieve_relevant_chunks(
            db=db,
            user_id=user_id,
            query=question,
            document_ids=valid_doc_ids,
            top_k=top_k
        )

        # 2. Generate grounded answer
        response = gemini_service.answer_with_rag(
            question=question,
            retrieved_chunks=retrieved_chunks
        )

        return response

rag_pipeline = RAGPipeline()
