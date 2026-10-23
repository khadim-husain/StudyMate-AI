import pymupdf as fitz
import os
import uuid
import re
from typing import List, Dict, Any, Tuple
import logging

logger = logging.getLogger(__name__)

class PDFProcessor:
    @staticmethod
    def validate_pdf(file_path: str) -> Tuple[bool, str]:
        """Validate that file exists, is non-empty, and can be opened as a valid PDF."""
        if not os.path.exists(file_path):
            return False, "File does not exist."
            
        file_size = os.path.getsize(file_path)
        if file_size == 0:
            return False, "The uploaded PDF file is empty (0 bytes)."
            
        try:
            with fitz.open(file_path) as doc:
                if doc.page_count == 0:
                    return False, "PDF contains no pages."
                # Test reading first page
                _ = doc[0].get_text()
            return True, "Valid PDF"
        except Exception as e:
            return False, f"Invalid or corrupted PDF file: {str(e)}"

    @staticmethod
    def extract_pages(file_path: str) -> List[Dict[str, Any]]:
        """Extract text from PDF page by page.
        Returns list of dicts: [ {'page_number': 1, 'text': '...', 'char_count': 120}, ... ]
        """
        extracted_pages = []
        total_text_length = 0

        with fitz.open(file_path) as doc:
            for page_idx in range(doc.page_count):
                page = doc[page_idx]
                page_text = page.get_text()
                # Clean up repeated whitespaces and null bytes
                cleaned_text = re.sub(r'\x00', '', page_text)
                cleaned_text = re.sub(r'\s+', ' ', cleaned_text).strip()
                
                total_text_length += len(cleaned_text)
                extracted_pages.append({
                    "page_number": page_idx + 1,
                    "text": cleaned_text,
                    "char_count": len(cleaned_text)
                })

        # Check if PDF appears to be a scanned image with no embedded text
        if extracted_pages and total_text_length < (len(extracted_pages) * 20):
            logger.warning(f"PDF {file_path} has very low text density ({total_text_length} chars across {len(extracted_pages)} pages). OCR may be required.")

        return extracted_pages
