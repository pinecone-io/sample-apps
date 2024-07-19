import os
import base64
import requests
import imghdr
from fastapi import APIRouter, UploadFile, File, HTTPException
from api.config import settings
from api import deps

router = APIRouter()

@router.post("/search/image")
async def query_image(file: UploadFile = File(...)):
    try:
        # Check file format
        contents = await file.read()
        file_format = imghdr.what(None, h=contents)
        
        # Vertex AI Multimodal Embedding Model only supports the following image formats
        if file_format not in ['bmp', 'gif', 'jpeg', 'png', 'jpg']:
            raise HTTPException(status_code=400, detail="We only support BMP, GIF, JPG, and PNG for images. Please upload a valid image file.")
        
        # Encode image to base64
        base64_encoded_image = base64.b64encode(contents).decode('utf-8')
        
        # Get the access token
        access_token = settings.get_access_token()
        
        # Prepare the API request
        url = f"https://{settings.location}-aiplatform.googleapis.com/v1/projects/{settings.project_id}/locations/{settings.location}/publishers/google/models/multimodalembedding@001:predict"
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }
        data = {
            "instances": [
                {
                    "image": {
                        "bytesBase64Encoded": base64_encoded_image
                    }
                }
            ]
        }
        
        # Make the API call
        response = requests.post(url, headers=headers, json=data)
        response.raise_for_status()
        
        # Extract the embedding from the response
        embedding_data = response.json()
        vector = embedding_data['predictions'][0]['imageEmbedding']
        
        # Query Pinecone
        query_response = deps.index.query(
            vector=vector,
            top_k=settings.k,
            include_metadata=True
        )
        
        matches = query_response['matches']
        results = [{
            "score": round(match['score'] * 100, 2),
            "metadata": {
                "gcs_file_name": match['metadata'].get('gcs_file_name'),
                "gcs_file_path": match['metadata'].get('gcs_file_path'),
                "gcs_public_url": f"https://storage.googleapis.com/{match['metadata'].get('gcs_file_path')}{match['metadata'].get('gcs_file_name')}",
                "file_type": match['metadata'].get('file_type'),
                "segment": match['metadata'].get('segment'),
                "start_offset_sec": match['metadata'].get('start_offset_sec'),
                "end_offset_sec": match['metadata'].get('end_offset_sec'),
                "interval_sec": match['metadata'].get('interval_sec'),
            }
        } for match in matches]
        
        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))