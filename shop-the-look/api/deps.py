from pinecone import Pinecone
from api.config import settings

pc = Pinecone(api_key=settings.api_key, source_tag="pinecone:stl_sample_app")
index = pc.Index(settings.index_name)
