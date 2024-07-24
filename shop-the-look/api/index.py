from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.v1.endpoints import text, image, video, index

app = FastAPI()

@app.get("/api")
async def root():
    return {"message": "Welcome to the Shop The Look API!"}

# Add CORS middleware
# CORS is important for:
# 1. Allowing controlled cross-origin access
# 2. Enhancing security
# 3. Enabling API interactions across domains
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

app.include_router(text.router, prefix="/api")
app.include_router(image.router, prefix="/api")
app.include_router(video.router, prefix="/api")
app.include_router(index.router, prefix="/api")