from pinecone import Pinecone
from api.config import settings

pc = Pinecone(api_key=settings.api_key)
index = pc.Index(settings.index_name)
