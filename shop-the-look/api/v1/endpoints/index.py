from fastapi import APIRouter, HTTPException
from api import deps

router = APIRouter()

@router.get("/index/info")
async def get_index_info():
    try:
        index_info = deps.index.describe_index_stats()
        total_vectors = index_info['total_vector_count']
        return {"total_vectors": total_vectors}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve index info: {str(e)}")
