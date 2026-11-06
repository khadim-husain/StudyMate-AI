from unittest.mock import patch
from app.rag.chunking import TextChunker
from app.ai.embedding_service import embedding_service
from app.rag.retrieval import VectorRetriever, cosine_similarity
from app.rag.pipeline import rag_pipeline
from app.models.document import Document
from app.models.chunk import DocumentChunk

def test_text_chunker():
    """Test text chunking splits long text and tracks page number."""
    chunker = TextChunker(chunk_size=100, chunk_overlap=20)
    pages = [
        {"page_number": 1, "text": "This is a short paragraph for page 1."},
        {"page_number": 2, "text": "Page two contains a significantly longer text that should be split into multiple chunk intervals with proper overlapping windows."}
    ]
    chunks = chunker.chunk_document_pages(pages)
    assert len(chunks) >= 2
    assert chunks[0]["page_number"] == 1
    assert any(c["page_number"] == 2 for c in chunks)

def test_embedding_service_dimensions():
    """Test embedding service returns vector of floats with valid dimensions (768 or 3072)."""
    text = "Machine learning algorithms optimize cost functions."
    vector = embedding_service.get_embedding(text)
    assert len(vector) in (768, 1536, 3072)
    assert all(isinstance(x, float) for x in vector)

def test_cosine_similarity():
    """Test cosine similarity calculation."""
    v1 = [1.0, 0.0, 0.0]
    v2 = [1.0, 0.0, 0.0]
    v3 = [0.0, 1.0, 0.0]
    assert cosine_similarity(v1, v2) == 1.0
    assert cosine_similarity(v1, v3) == 0.0

def test_rag_pipeline_with_mocked_gemini(db_session, test_user):
    """Test RAG pipeline returns grounded answers and citations."""
    # Create document and chunk in db
    doc = Document(
        user_id=test_user.id,
        filename="Algorithms_Textbook.pdf",
        storage_path="mock/path.pdf",
        file_size=1024,
        page_count=10,
        processing_status="completed"
    )
    db_session.add(doc)
    db_session.commit()

    chunk_content = "Dijkstra algorithm finds shortest paths in graphs with non-negative weights in O(E log V) time."
    chunk = DocumentChunk(
        document_id=doc.id,
        user_id=test_user.id,
        chunk_index=0,
        page_number=4,
        content=chunk_content,
        embedding=embedding_service.get_embedding(chunk_content)
    )
    db_session.add(chunk)
    db_session.commit()

    with patch("app.ai.gemini_service.gemini_service.answer_with_rag") as mock_answer:
        mock_answer.return_value = {
            "content": "Dijkstra's algorithm operates with non-negative edge weights.",
            "citations": [
                {
                    "document_id": doc.id,
                    "document_title": doc.filename,
                    "page_number": 4,
                    "chunk_index": 0,
                    "text_snippet": chunk_content[:50]
                }
            ]
        }

        result = rag_pipeline.answer_question(
            db=db_session,
            user_id=test_user.id,
            question="What is the time complexity of Dijkstra?",
            document_ids=[doc.id]
        )

        assert "content" in result
        assert len(result["citations"]) == 1
        assert result["citations"][0]["page_number"] == 4
