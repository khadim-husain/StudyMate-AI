import logging
from sqlalchemy.orm import Session
from app.models.document import Document
from app.models.chunk import DocumentChunk
from app.rag.pdf_processor import PDFProcessor
from app.rag.chunking import TextChunker
from app.ai.embedding_service import embedding_service

logger = logging.getLogger(__name__)

class DocumentIngestionService:
    @staticmethod
    def process_document(db: Session, document_id: str) -> bool:
        """Process an uploaded PDF: extract pages, chunk text, generate embeddings, and store in DB."""
        doc = db.query(Document).filter(Document.id == document_id).first()
        if not doc:
            logger.error(f"Document {document_id} not found for ingestion.")
            return False

        try:
            doc.processing_status = "processing"
            db.commit()

            # 1. Validate PDF
            is_valid, err_msg = PDFProcessor.validate_pdf(doc.storage_path)
            if not is_valid:
                doc.processing_status = "failed"
                doc.processing_error = err_msg
                db.commit()
                return False

            # 2. Extract Pages
            pages = PDFProcessor.extract_pages(doc.storage_path)
            doc.page_count = len(pages)

            # 3. Chunk Text
            chunker = TextChunker(chunk_size=800, chunk_overlap=150)
            raw_chunks = chunker.chunk_document_pages(pages)

            if not raw_chunks:
                # Document has no readable text (likely scanned without OCR)
                doc.processing_status = "completed"
                doc.processing_error = "Document has minimal extractable text. Scanned document OCR may be needed."
                db.commit()
                return True

            # Clean any existing chunks for retries to prevent duplicate chunks
            db.query(DocumentChunk).filter(DocumentChunk.document_id == doc.id).delete()

            # 4. Generate Embeddings & Store Chunks
            for chunk_data in raw_chunks:
                vector = embedding_service.get_embedding(chunk_data["content"])
                chunk_record = DocumentChunk(
                    document_id=doc.id,
                    user_id=doc.user_id,
                    chunk_index=chunk_data["chunk_index"],
                    page_number=chunk_data["page_number"],
                    content=chunk_data["content"],
                    embedding=vector
                )
                db.add(chunk_record)

            doc.processing_status = "completed"
            doc.processing_error = None
            db.commit()
            logger.info(f"Successfully processed document {doc.id} ({doc.filename}): {len(raw_chunks)} chunks indexed.")
            return True

        except Exception as e:
            logger.exception(f"Error processing document {document_id}: {e}")
            doc.processing_status = "failed"
            doc.processing_error = str(e)
            db.commit()
            return False

ingestion_service = DocumentIngestionService()
