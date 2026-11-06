import pymupdf as fitz
import os
import uuid
import re
from typing import List, Dict, Any, Tuple, Union
import logging
from app.services.storage_service import storage_service

logger = logging.getLogger(__name__)

class PDFProcessor:
    @staticmethod
    def _open_pdf(target: Union[str, bytes]):
        """Helper to open fitz document from bytes, S3 URI, or local filesystem path."""
        if isinstance(target, bytes):
            return fitz.open(stream=target, filetype="pdf")
        if isinstance(target, str):
            if target.startswith("s3://"):
                file_bytes = storage_service.get_file_bytes(target)
                if not file_bytes:
                    raise FileNotFoundError(f"Cloud storage file not found: {target}")
                return fitz.open(stream=file_bytes, filetype="pdf")
            if os.path.exists(target):
                return fitz.open(target)
            # Try fetching via storage service if path was stored
            file_bytes = storage_service.get_file_bytes(target)
            if file_bytes:
                return fitz.open(stream=file_bytes, filetype="pdf")
        raise FileNotFoundError(f"PDF target could not be opened: {target}")

    @staticmethod
    def validate_pdf(target: Union[str, bytes]) -> Tuple[bool, str]:
        """Validate that file exists, is non-empty, and can be opened as a valid PDF."""
        try:
            with PDFProcessor._open_pdf(target) as doc:
                if doc.page_count == 0:
                    return False, "PDF contains no pages."
                _ = doc[0].get_text()
            return True, "Valid PDF"
        except Exception as e:
            return False, f"Invalid or corrupted PDF file: {str(e)}"

    @staticmethod
    def extract_pages(target: Union[str, bytes]) -> List[Dict[str, Any]]:
        """Extract text from PDF page by page.
        Returns list of dicts: [ {'page_number': 1, 'text': '...', 'char_count': 120}, ... ]
        """
        extracted_pages = []
        total_text_length = 0

        with PDFProcessor._open_pdf(target) as doc:
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
            logger.warning(f"PDF has very low text density ({total_text_length} chars across {len(extracted_pages)} pages). OCR may be required.")

        return extracted_pages
