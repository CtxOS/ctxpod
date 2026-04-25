from fastapi import Security, HTTPException, status
from fastapi.security.api_key import APIKeyHeader
import os

API_KEY_NAME = "X-Grid-API-Key"
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)

# In production, these would be in a database or vault
VALID_API_KEYS = {
    os.getenv("GRID_ADMIN_KEY", "khulnasoft-admin-123"): "admin",
    os.getenv("GRID_AGENT_KEY", "khulnasoft-agent-456"): "agent"
}

async def get_api_key(api_key: str = Security(api_key_header)):
    if api_key in VALID_API_KEYS:
        return VALID_API_KEYS[api_key]
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Could not validate API Key"
    )
