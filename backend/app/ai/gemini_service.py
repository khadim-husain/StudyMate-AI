import json
import logging
import re
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

    def _generate(self, prompt: str, system_instruction: Optional[str] = None) -> Optional[str]:
        """Call Gemini model to generate content. Returns None if client is unavailable or call fails."""
        if not self._client:
            return None

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
            logger.warning(f"Gemini API generation error: {e}. Falling back to semantic extraction.")
            return None

    def answer_with_rag(self, question: str, retrieved_chunks: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Generate document-grounded response with verified citations."""
        citations = []
        context_blocks = []

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

        # 1. Attempt Live Gemini Generation
        if self._client:
            if not retrieved_chunks:
                prompt = (
                    f"Question: {question}\n\n"
                    "Note: No specific textbook citations were found in the uploaded documents. "
                    "Provide a helpful academic response explaining the fundamental concepts clearly."
                )
            else:
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

            ai_response = self._generate(prompt, system_instruction=system_instruction)
            if ai_response:
                return {
                    "content": ai_response,
                    "citations": citations
                }

        # 2. Resilient Semantic Synthesis Fallback (when API key is empty or service is unreachable)
        if retrieved_chunks:
            primary_chunk = retrieved_chunks[0]
            answer_text = (
                f"### Evidence from your study materials for: *\"{question}\"*\n\n"
                f"**From {primary_chunk['document_title']} (Page {primary_chunk['page_number']})**:\n\n"
                f"> {primary_chunk['content']}\n\n"
                f"📚 *Source Citation: [Source 1: {primary_chunk['document_title']}, Page {primary_chunk['page_number']}]*"
            )
            if len(retrieved_chunks) > 1:
                secondary = retrieved_chunks[1]
                answer_text += (
                    f"\n\n**Additional context from Page {secondary['page_number']}**:\n\n"
                    f"> {secondary['content'][:250]}...\n\n"
                    f"📚 *Source Citation: [Source 2: {secondary['document_title']}, Page {secondary['page_number']}]*"
                )
            if not self._client:
                answer_text += "\n\n*(Note: Configure GEMINI_API_KEY in backend/.env for live conversational multi-turn AI responses.)*"
        else:
            answer_text = (
                f"I searched through your indexed study documents, but could not find specific passages matching: *\"{question}\"*.\n\n"
                "💡 **Suggestions**:\n"
                "• Upload the relevant chapter or lecture PDF in the Materials tab.\n"
                "• Try rephrasing your search keywords or topic terms."
            )
            if not self._client:
                answer_text += "\n\n*(Note: Set GEMINI_API_KEY in backend/.env to enable broad academic knowledge outside your documents.)*"

        return {
            "content": answer_text,
            "citations": citations
        }

    def generate_summary(self, doc_title: str, text_content: str, summary_type: str = "medium") -> Dict[str, Any]:
        """Generate executive summary, key concepts, and revision notes."""
        if self._client:
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

            if raw_response:
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
                except Exception as e:
                    logger.warning(f"Error parsing Gemini summary JSON: {e}")

        # Semantic Extraction Fallback from text content
        paragraphs = [p.strip() for p in text_content.split("\n\n") if len(p.strip()) > 30]
        sentences = [s.strip() for s in re.split(r'[.!?]+', text_content) if len(s.strip()) > 20]

        summary_body = (
            f"## Study Overview: {doc_title}\n\n"
            + ("\n\n".join(paragraphs[:3]) if paragraphs else "Core principles and lecture notes extracted from course materials.")
        )
        if len(paragraphs) > 3:
            summary_body += f"\n\n### Theoretical Foundations\n{paragraphs[3]}"

        concepts = []
        for s in sentences[:6]:
            words = s.split()
            if len(words) >= 4:
                concept = " ".join(words[:4]).strip(",.-")
                if concept and concept not in concepts:
                    concepts.append(concept.capitalize())
        if not concepts:
            concepts = ["Core Foundations", "Mathematical Frameworks", "Algorithm Execution", "Experimental Results"]

        revision = [
            f"Review key definitions in {doc_title} before exams.",
            "Understand the underlying trade-offs and complexity guarantees.",
            "Practice worked numerical examples from lecture slides."
        ]

        return {
            "summary": summary_body,
            "key_concepts": concepts[:4],
            "revision_notes": revision
        }

    def generate_quiz(self, topic: str, text_content: str, num_questions: int = 5, difficulty: str = "medium") -> List[Dict[str, Any]]:
        """Generate multiple choice questions with options and explanations."""
        if self._client:
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

            if raw_response:
                try:
                    cleaned = raw_response.strip()
                    if cleaned.startswith("```json"):
                        cleaned = cleaned[7:]
                    if cleaned.startswith("```"):
                        cleaned = cleaned[3:]
                    if cleaned.endswith("```"):
                        cleaned = cleaned[:-3]
                    questions = json.loads(cleaned.strip())
                    if isinstance(questions, list) and len(questions) > 0:
                        return questions[:num_questions]
                except Exception as e:
                    logger.warning(f"Failed to parse quiz questions JSON: {e}")

        # Semantic Question Generation Fallback
        sentences = [s.strip() for s in re.split(r'[.!?]+', text_content) if len(s.strip()) > 35]
        questions = []

        if len(sentences) >= 2:
            s1 = sentences[0]
            questions.append({
                "question": f"According to the study material on {topic}, which of the following is true regarding: \"{s1[:60]}...\"?",
                "options": [
                    f"It accurately reflects: {s1[:90]}",
                    "It has no relation to the core methodology discussed in lectures",
                    "It is deprecated and replaced by random initialization",
                    "It only applies to linear regression models"
                ],
                "correct_answer": 0,
                "explanation": f"The lecture notes state: \"{s1}\"."
            })
            if len(sentences) >= 2:
                s2 = sentences[1]
                questions.append({
                    "question": f"What primary mechanism is highlighted in the study material regarding: \"{s2[:60]}...\"?",
                    "options": [
                        "Exhaustive brute-force search",
                        f"Principle: {s2[:85]}",
                        "Manual human intervention during runtime",
                        "Random gradient pertubation"
                    ],
                    "correct_answer": 1,
                    "explanation": f"As detailed in the syllabus: \"{s2}\"."
                })

        # Ensure at least requested number of questions
        while len(questions) < num_questions:
            idx = len(questions) + 1
            questions.append({
                "question": f"In {topic}, what is the fundamental purpose of core optimization and evaluation metrics?",
                "options": [
                    "To increase memory latency during training",
                    "To measure generalization performance and minimize loss on unseen data",
                    "To avoid using mathematical formulas",
                    "To ensure networks only memorize training instances"
                ],
                "correct_answer": 1,
                "explanation": "Optimization metrics quantify model convergence and generalization capability."
            })

        return questions[:num_questions]

    def generate_flashcards(self, topic: str, text_content: str, num_cards: int = 5) -> List[Dict[str, str]]:
        """Generate high-yield flashcard Q&As."""
        if self._client:
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

            if raw_response:
                try:
                    cleaned = raw_response.strip()
                    if cleaned.startswith("```json"):
                        cleaned = cleaned[7:]
                    if cleaned.startswith("```"):
                        cleaned = cleaned[3:]
                    if cleaned.endswith("```"):
                        cleaned = cleaned[:-3]
                    cards = json.loads(cleaned.strip())
                    if isinstance(cards, list) and len(cards) > 0:
                        return cards[:num_cards]
                except Exception as e:
                    logger.warning(f"Failed to parse flashcards JSON: {e}")

        # Semantic Flashcard Generation Fallback
        sentences = [s.strip() for s in re.split(r'[.!?]+', text_content) if len(s.strip()) > 30]
        cards = []

        for s in sentences[:num_cards]:
            words = s.split()
            if len(words) >= 5:
                concept = " ".join(words[:4]).strip(",.-")
                cards.append({
                    "question": f"What is {concept}?",
                    "answer": s
                })

        while len(cards) < num_cards:
            cards.append({
                "question": f"Key Principle #{len(cards)+1} in {topic}",
                "answer": f"Core theoretical formulation and empirical method detailed in {topic}."
            })

        return cards[:num_cards]

gemini_service = GeminiService()
