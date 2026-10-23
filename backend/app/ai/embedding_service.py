import hashlib
import math
from typing import List
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

class EmbeddingService:
    def __init__(self):
        self.dimension = settings.EMBEDDING_DIMENSION
        self.model = settings.EMBEDDING_MODEL
        self._client = None
        
        if settings.GEMINI_API_KEY:
            try:
                from google import genai
                self._client = genai.Client(api_key=settings.GEMINI_API_KEY)
            except Exception as e:
                logger.warning(f"Could not initialize Google Gen AI Client: {e}")

    def get_embedding(self, text: str) -> List[float]:
        """Generate embedding vector for a single string."""
        if not text:
            return [0.0] * self.dimension

        if self._client:
            try:
                result = self._client.models.embed_content(
                    model=self.model,
                    contents=text
                )
                if hasattr(result, "embeddings") and result.embeddings:
                    return result.embeddings[0].values
                if hasattr(result, "embedding") and hasattr(result.embedding, "values"):
                    return result.embedding.values
            except Exception as e:
                logger.warning(f"Gemini API embed_content failed: {e}. Using deterministic semantic projection.")

        # Deterministic normalized hash-based embedding for testing / offline environments
        return self._generate_fallback_embedding(text)

    def get_embeddings_batch(self, texts: List[str]) -> List[List[float]]:
        """Batch embedding generation."""
        return [self.get_embedding(t) for t in texts]

    def _generate_fallback_embedding(self, text: str) -> List[float]:
        """Generate a deterministic 768-dimensional unit vector from text tokens."""
        vector = [0.0] * self.dimension
        words = text.lower().split()
        for idx, word in enumerate(words):
            h = int(hashlib.sha256(word.encode()).hexdigest(), 16)
            pos = h % self.dimension
            weight = 1.0 / (1.0 + math.log1p(idx))
            vector[pos] += weight

        # Normalize to unit length
        norm = math.sqrt(sum(x * x for x in vector))
        if norm > 0:
            return [x / norm for x in vector]
        return [0.01] * self.dimension

embedding_service = EmbeddingService()
