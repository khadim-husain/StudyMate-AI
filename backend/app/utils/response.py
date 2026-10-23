from typing import Any, Dict, Optional

def success_response(data: Any = None, message: str = "Success") -> Dict[str, Any]:
    """Helper to return consistent JSON response envelopes when needed."""
    return {
        "success": True,
        "message": message,
        "data": data
    }
