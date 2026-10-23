import json
import logging
from typing import List, Dict, Any, Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

class GeminiService:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.model_name = settings.GEMINI_MODEL
        self._client = None

        if self.api_key:
            try:
                from google import genai
                self._client = genai.Client(api_key=self.api_key)
            except Exception as e:
                logger.warning(f"Failed to initialize Google Gen AI Client: {e}")

    def _generate(self, prompt: str, system_instruction: Optional[str] = None) -> str:
        """Call Gemini model to generate content."""
        if not self._client:
            raise ValueError(
                "Gemini API key is not configured. Please set GEMINI_API_KEY in your backend .env file to enable live AI responses."
            )

        try:
            config = {}
            if system_instruction:
                config["system_instruction"] = system_instruction

            response = self._client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=config if config else None
            )
            return response.text or ""
        except Exception as e:
            logger.error(f"Gemini API generation error: {e}")
            raise RuntimeError(f"AI Service Error: {str(e)}")

    def answer_with_rag(self, question: str, retrieved_chunks: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Generate document-grounded response with verified citations."""
        if not retrieved_chunks:
            # Fallback when no relevant context was found in user's documents
            prompt = (
                f"Question: {question}\n\n"
                "Note: No specific textbook citations were found in the uploaded documents. "
                "Provide a helpful academic response explaining the fundamental concepts clearly."
            )
            text = self._generate(prompt, system_instruction="You are StudyMate AI, an expert academic study assistant.")
            return {
                "content": text,
                "citations": []
            }

        context_blocks = []
        citations = []
        for idx, chunk in enumerate(retrieved_chunks):
            context_blocks.append(
                f"[Source {idx+1}: {chunk['document_title']}, Page {chunk['page_number']}]\n{chunk['content']}"
            )
            citations.append({
                "document_id": chunk["document_id"],
                "document_title": chunk["document_title"],
                "page_number": chunk["page_number"],
                "chunk_index": chunk["chunk_index"],
                "text_snippet": chunk["content"][:160] + "..."
            })

        evidence = "\n\n".join(context_blocks)
        prompt = (
            f"Context Evidence from Student's Documents:\n{evidence}\n\n"
            f"Student Question: {question}\n\n"
            "Instructions:\n"
            "1. Answer the student's question accurately using the provided evidence.\n"
            "2. Cite your sources clearly using [Source X: Document, Page Y].\n"
            "3. If the evidence does not contain sufficient details to answer fully, explicitly state that."
        )

        system_instruction = (
            "You are StudyMate AI, an elite university tutor. "
            "Prioritize the student's uploaded textbook and lecture evidence strictly. "
            "Never invent citations or page references."
        )

        answer_text = self._generate(prompt, system_instruction=system_instruction)
        return {
            "content": answer_text,
            "citations": citations
        }

    def generate_summary(self, doc_title: str, text_content: str, summary_type: str = "medium") -> Dict[str, Any]:
        """Generate executive summary, key concepts, and revision notes."""
        prompt = (
            f"Document Title: {doc_title}\n\n"
            f"Content Sample:\n{text_content[:12000]}\n\n"
            f"Task: Generate a {summary_type.upper()} study summary.\n"
            "Respond in JSON format with exact keys:\n"
            "{\n"
            '  "summary": "Clear, structured markdown summary with headings",\n'
            '  "key_concepts": ["Concept 1", "Concept 2", "Concept 3", "Concept 4"],\n'
            '  "revision_notes": ["Exam note 1", "Formula/rule 2", "Common trap 3"]\n'
            "}"
        )

        system_instruction = "You are an academic summarization engine. Always return valid JSON."
        raw_response = self._generate(prompt, system_instruction=system_instruction)

        # Parse JSON from response
        try:
            cleaned = raw_response.strip()
            if cleaned.startswith("```json"):
                cleaned = cleaned[7:]
            if cleaned.startswith("```"):
                cleaned = cleaned[3:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            data = json.loads(cleaned.strip())
            return {
                "summary": data.get("summary", ""),
                "key_concepts": data.get("key_concepts", []),
                "revision_notes": data.get("revision_notes", [])
            }
        except Exception:
            return {
                "summary": raw_response,
                "key_concepts": ["Core Subject Principles", "Key Theoretical Formulations"],
                "revision_notes": ["Review primary chapter definitions before exams."]
            }

    def generate_quiz(self, topic: str, text_content: str, num_questions: int = 5, difficulty: str = "medium") -> List[Dict[str, Any]]:
        """Generate multiple choice questions with options and explanations."""
        prompt = (
            f"Topic: {topic}\n"
            f"Difficulty: {difficulty}\n"
            f"Number of Questions: {num_questions}\n\n"
            f"Source Material:\n{text_content[:10000]}\n\n"
            "Generate multiple-choice questions in JSON format:\n"
            "[\n"
            "  {\n"
            '    "question": "What is ...?",\n'
            '    "options": ["Option A", "Option B", "Option C", "Option D"],\n'
            '    "correct_answer": 1,\n'
            '    "explanation": "Explanation of why Option B is correct and others are wrong."\n'
            "  }\n"
            "]\n"
            "Note: correct_answer must be an integer index from 0 to 3."
        )

        system_instruction = "You are a university professor creating rigorous multiple-choice exam questions. Return valid JSON only."
        raw_response = self._generate(prompt, system_instruction=system_instruction)

        try:
            cleaned = raw_response.strip()
            if cleaned.startswith("```json"):
                cleaned = cleaned[7:]
            if cleaned.startswith("```"):
                cleaned = cleaned[3:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            questions = json.loads(cleaned.strip())
            return questions[:num_questions]
        except Exception as e:
            logger.error(f"Failed to parse quiz questions JSON: {e}")
            raise ValueError("Could not parse quiz generation response from AI.")

    def generate_flashcards(self, topic: str, text_content: str, num_cards: int = 5) -> List[Dict[str, str]]:
        """Generate high-yield flashcard Q&As."""
        prompt = (
            f"Topic: {topic}\n"
            f"Number of Flashcards: {num_cards}\n\n"
            f"Source Text:\n{text_content[:8000]}\n\n"
            "Generate flashcards in JSON format:\n"
            "[\n"
            "  {\n"
            '    "question": "Clear, concise prompt or concept name",\n'
            '    "answer": "Complete, accurate definition or explanation"\n'
            "  }\n"
            "]"
        )

        system_instruction = "You are an expert tutor creating active recall flashcards. Return valid JSON only."
        raw_response = self._generate(prompt, system_instruction=system_instruction)

        try:
            cleaned = raw_response.strip()
            if cleaned.startswith("```json"):
                cleaned = cleaned[7:]
            if cleaned.startswith("```"):
                cleaned = cleaned[3:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            cards = json.loads(cleaned.strip())
            return cards[:num_cards]
        except Exception as e:
            logger.error(f"Failed to parse flashcards JSON: {e}")
            raise ValueError("Could not parse flashcard generation response from AI.")

gemini_service = GeminiService()
