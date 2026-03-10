"""
Fallback module for 'js' magic module in Cloudflare Workers.
This file provides type information and local development support.
"""

from typing import Any, Dict, Optional

class Response:
    """The JavaScript Response object."""
    def __init__(self, body: Any = None, init: Optional[Dict[str, Any]] = None):
        pass
    
    @staticmethod
    def new(body: Any = None, init: Optional[Dict[str, Any]] = None) -> 'Response':
        return Response(body, init)

class URL:
    """The JavaScript URL object."""
    def __init__(self, url: str, base: Optional[str] = None):
        self.pathname = "/"
        self.search = ""
        self.hostname = "localhost"
    
    @staticmethod
    def new(url: str, base: Optional[str] = None) -> 'URL':
        return URL(url, base)

def setTimeout(callback: Any, delay: int) -> int:
    return 0

def clearTimeout(id: int) -> None:
    pass

def setInterval(callback: Any, delay: int) -> int:
    return 0

def clearInterval(id: int) -> None:
    pass

console: Any = None
