import math
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.chunk import DocumentChunk
from app.models.document import Document
from app.ai.embedding_service import embedding_service

def cosine_similarity(v1: List[float], v2: List[float]) -> float:
    """Calculate cosine similarity between two float vectors."""
    if not v1 or not v2 or len(v1) != len(v2):
        return 0.0
    dot = sum(a * b for a, b in zip(v1, v2))
    norm1 = math.sqrt(sum(a * a for a in v1))
    norm2 = math.sqrt(sum(b * b for b in v2))
    if norm1 == 0 or norm2 == 0:
        return 0.0
    return dot / (norm1 * norm2)

class VectorRetriever:
    @staticmethod
    def retrieve_relevant_chunks(
        db: Session,
        user_id: str,
        query: str,
        document_ids: Optional[List[str]] = None,
        top_k: int = 5,
        min_similarity: float = 0.15
    ) -> List[Dict[str, Any]]:
        """Retrieve most relevant chunks for user query filtered strictly by user_id and document_ids."""
        query_embedding = embedding_service.get_embedding(query)

        # Base query filtered by user_id for strict multi-tenant security isolation
        q = db.query(DocumentChunk, Document.filename).join(Document, DocumentChunk.document_id == Document.id)
        q = q.filter(DocumentChunk.user_id == user_id)

        if document_ids:
            q = q.filter(DocumentChunk.document_id.in_(document_ids))

        chunks_with_doc = q.all()

        if not chunks_with_doc:
            return []

        # Rank by cosine similarity
        scored_chunks = []
        all_candidates = []
        for chunk, filename in chunks_with_doc:
            if not chunk.embedding:
                continue
            sim = cosine_similarity(query_embedding, chunk.embedding)
            chunk_data = {
                "chunk_id": chunk.id,
                "document_id": chunk.document_id,
                "document_title": filename,
                "page_number": chunk.page_number,
                "chunk_index": chunk.chunk_index,
                "content": chunk.content,
                "similarity": round(float(sim), 4)
            }
            all_candidates.append(chunk_data)
            if sim >= min_similarity:
                scored_chunks.append(chunk_data)

        # If document_ids was explicitly targeted and no chunk passed strict min_similarity threshold,
        # fallback to the highest scoring chunks to preserve RAG context
        if not scored_chunks and document_ids and all_candidates:
            all_candidates.sort(key=lambda x: x["similarity"], reverse=True)
            if all_candidates[0]["similarity"] > 0.05:
                scored_chunks = all_candidates[:top_k]

        # Sort descending by similarity score
        scored_chunks.sort(key=lambda x: x["similarity"], reverse=True)
        return scored_chunks[:top_k]
