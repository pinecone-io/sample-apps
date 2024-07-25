"""
Image Embedding Generator and Upserter

This script processes images from a Google Cloud Storage (GCS) bucket,
generates embeddings using Vertex AI, and upserts them to a Pinecone index.

Requirements:
- Python 3.7+
- Google Cloud SDK
- Pinecone account
- Vertex AI API enabled in your Google Cloud project

Required Python packages:
- vertexai
- google-cloud-storage
- pinecone-client

Usage:
1. Set up environment variables (see below)
2. Run the script with the required arguments

Example:
python image_embedding_processor.py -p your-gc-project-id -b your-gcs-bucket-name -f your-gcs-folder-name -i your-pinecone-index-name
"""

import base64
from concurrent.futures import ThreadPoolExecutor, as_completed
import json
import vertexai
from pinecone import Pinecone
import os
import uuid
import vertexai
from datetime import datetime
import time
from vertexai.vision_models import MultiModalEmbeddingModel, Image
from google.cloud import storage

REGION = 'us-central1'
FILE_TYPE = 'image'

def process_image(image_file, bucket_name, prefix, model, index, file_path, image_index, total_images, max_retries=5):
    gcs_uri = f'gs://{bucket_name}/{prefix}/{image_file}'

    # TODO: TEMPORARY FILE PATH
    file_path = 'multi-modal-sample-app/pexels-clothing/' 

    attempt = 0
    while attempt < max_retries:
        try:
            image = Image.load_from_file(gcs_uri)

            embeddings = model.get_embeddings(
                image=image,
            )

            print(f"Received embeddings for: {image_file} ({image_index}/{total_images})")

            date_added = datetime.now().isoformat()
            embedding_id = str(uuid.uuid4())
            
            vector = [
                {
                    'id': embedding_id,
                    'values': embeddings.image_embedding,
                    'metadata': {
                        'date_added': date_added,
                        'file_type': FILE_TYPE,
                        'gcs_file_path': file_path,
                        'gcs_file_name': image_file,
                    }
                }
            ]
            index.upsert(vector)
            print(f"Processed and upserted: {image_file} ({image_index}/{total_images})")
            break  # Exit loop if successful
        except Exception as e:
            print(f"Error processing file {image_file}: {e}")
            attempt += 1
            if attempt < max_retries:
                wait_time = 5 ** attempt  # Exponential backoff
                print(f"Retrying in {wait_time} seconds...")
                time.sleep(wait_time)
            else:
                print(f"Failed to process file {image_file} after {max_retries} attempts.")

def main(gc_project_id, gcs_bucket_name, gcs_folder_name, pinecone_index_name):
    api_key = os.getenv('PINECONE_API_KEY')  # Pinecone API key
    file_path = f'{gcs_bucket_name}/{gcs_folder_name}/'  # GCS bucket path

    google_credentials_base64 = os.getenv('GOOGLE_CREDENTIALS_BASE64')
    credentials_path = '/tmp/google-credentials.json'

    if google_credentials_base64:
        google_credentials = base64.b64decode(google_credentials_base64).decode('utf-8')
        with open(credentials_path, 'w') as f:
            f.write(google_credentials)
        os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = credentials_path

    pc = Pinecone(api_key=api_key, source_tag="pinecone:stl_sample_app")
    index = pc.Index(pinecone_index_name)

    vertexai.init(project=gc_project_id, location=REGION)

    model = MultiModalEmbeddingModel.from_pretrained("multimodalembedding@001")

    client = storage.Client()
    blobs = client.list_blobs(gcs_bucket_name, prefix=gcs_folder_name)
    image_files = [blob.name.replace(gcs_folder_name + '/', '') for blob in blobs if blob.name.endswith(('jpeg', 'jpg', 'png', 'bmp', 'gif'))]

    total_images = len(image_files)
    with ThreadPoolExecutor() as executor:
        futures = [executor.submit(process_image, image_file, gcs_bucket_name, gcs_folder_name, model, index, file_path, i + 1, total_images) for i, image_file in enumerate(image_files)]
        for future in as_completed(futures):
            future.result()  # This will re-raise any exceptions that occurred during processing

if __name__ == '__main__':
    import argparse

    parser = argparse.ArgumentParser(description='Process images from a GCS bucket and upsert embeddings to Pinecone.')
    parser.add_argument('-p', '--project', type=str, required=True, help='The Google Cloud project ID.')
    parser.add_argument('-b', '--bucket', type=str, required=True, help='The Google Cloud Storage bucket.')
    parser.add_argument('-f', '--folder', type=str, required=True, help='The GCS folder containing images in the bucket.')
    parser.add_argument('-i', '--index', type=str, required=True, help='The Pinecone Index name.')

    args = parser.parse_args()
    main(args.project, args.bucket, args.folder, args.index)

"""
Setup Instructions:

1. Environment Variables:
   Set the following environment variables before running the script:

   a. GOOGLE_CREDENTIALS_BASE64
      Base64-encoded Google Cloud service account key JSON.
      To set this:
      - Get your service account key JSON file
      - Encode it to base64:
        $ base64 -i path/to/your/service-account-key.json | tr -d '\n'
      - Set the environment variable:
        $ export GOOGLE_CREDENTIALS_BASE64="<base64-encoded-string>"

   b. PINECONE_API_KEY
      Your Pinecone API key.
      $ export PINECONE_API_KEY="your-pinecone-api-key"

2. Install required Python packages:
   $ pip install vertexai google-cloud-storage pinecone-client

3. Setup Google Cloud authentication for your environment: https://cloud.google.com/vertex-ai/generative-ai/docs/embeddings/get-multimodal-embeddings#prereqs

4. Run the script:
   $ python image_embedding_processor.py -p your-gc-project-id -b your-gcs-bucket-name -f your-gcs-folder-name -i your-pinecone-index-name

   Replace the placeholders with your actual values:
   - your-gc-project-id: Your Google Cloud project ID
   - your-gcs-bucket-name: The name of your GCS bucket containing the images
   - your-gcs-folder-name: The folder name within the bucket where images are stored
   - your-pinecone-index-name: The name of your Pinecone index

Example command:
$ python image_embedding_processor.py -p my-gcp-project -b my-image-bucket -f processed-images -i my-pinecone-index

Notes:
- Ensure that your Google Cloud service account has the necessary permissions to access the GCS bucket and use Vertex AI.
- The script supports the following image formats: jpeg, jpg, png, bmp, gif.
- The script uses exponential backoff for retrying failed operations, with a maximum of 5 attempts per image.
"""
