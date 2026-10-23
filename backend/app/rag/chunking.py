from typing import List, Dict, Any

class TextChunker:
    def __init__(self, chunk_size: int = 800, chunk_overlap: int = 150):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

    def chunk_document_pages(self, pages: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Split page texts into overlapping chunks while tracking original page numbers."""
        chunks = []
        chunk_index = 0

        for page_data in pages:
            page_number = page_data["page_number"]
            text = page_data["text"]

            if not text or len(text.strip()) < 30:
                continue

            # If page text fits in a single chunk
            if len(text) <= self.chunk_size:
                chunks.append({
                    "chunk_index": chunk_index,
                    "page_number": page_number,
                    "content": text
                })
                chunk_index += 1
                continue

            # Sliding window chunking
            start = 0
            while start < len(text):
                end = start + self.chunk_size

                # Try to break at a space or punctuation boundary
                if end < len(text):
                    last_space = text.rfind(' ', start, end)
                    last_period = text.rfind('. ', start, end)
                    if last_period > start + (self.chunk_size // 2):
                        end = last_period + 1
                    elif last_space > start + (self.chunk_size // 2):
                        end = last_space

                chunk_text = text[start:end].strip()
                if len(chunk_text) >= 40:
                    chunks.append({
                        "chunk_index": chunk_index,
                        "page_number": page_number,
                        "content": chunk_text
                    })
                    chunk_index += 1

                # Advance window with overlap
                start = end - self.chunk_overlap
                if start >= len(text) or end >= len(text):
                    break

        return chunks
