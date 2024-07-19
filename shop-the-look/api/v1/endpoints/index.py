# api/index_info.py
from fastapi import APIRouter
from api import deps

router = APIRouter()

@router.get("/index/info")
async def get_index_info():
    index_info = deps.index.describe_index_stats()
    total_vectors = index_info['total_vector_count']
    return {"total_vectors": total_vectors}
