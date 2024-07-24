# Image and Video Embedding Processors

The Image and Video Embedding Processor scripts were made to easily process a folder of images and videos from Google Cloud Storage, generate embeddings using Vertex AI, and upsert them to Pinecone Index. Both scripts are optimized for performance, featuring parallel processing and built-in rate limit handling (as the Vertex AI endpoint has a maximum of about 200 requests per second). 

This folder contains two scripts:

1. [Image Embedding Processor](#image-embedding-processor)
2. [Video Embedding Processor](#video-embedding-processor)

# Requirements

- Python 3.7+
- Google Cloud SDK
- Pinecone account with Pinecone Serverless Index (look at main docs on setting this up)
- Vertex AI API enabled in your Google Cloud project (look at main docs on setting this up)

# Setup

The setup process mirrors the [Setup & Installation](https://github.com/pinecone-io/sample-apps/blob/main/shop-the-look/README.md) instructions in [Shop The Look's README](https://github.com/pinecone-io/sample-apps/blob/main/shop-the-look/README.md), so for additional detail, please consult that documentation first. 

Here's a short summary:

1. Install required packages:
   
   ```
   pip install vertexai google-cloud-storage pinecone-client
   ```

2. ***IMPORTANT***: Setup [Google Cloud authentication](https://cloud.google.com/vertex-ai/generative-ai/docs/embeddings/get-multimodal-embeddings#prereqs) for your environment. 

3. Set environment variables:
   
   ```
   export GOOGLE_CREDENTIALS_BASE64="<base64-encoded-service-account-key>"
   export PINECONE_API_KEY="your-pinecone-api-key"
   ```

4. Prepare your assets:
   
   a. Upload all your images and/or videos to a Google Cloud Storage bucket - **make sure there is no sensitive or private data in these assets, this is public**. You can use the following command:
      
      ```
      gsutil -m cp -r /path/to/your/local/assets/* gs://your-bucket-name/your-folder-name/
      ```

      Replace `/path/to/your/local/assets/`, `your-bucket-name`, and `your-folder-name` with your actual paths and names.

   b. Make the bucket publicly-readable:
      - In the Google Cloud Console, navigate to your bucket.
      - Go to the "Permissions" tab.
      - Click "+ Grant Access"
      ![image](https://github.com/user-attachments/assets/3ae9cd25-b548-44f5-87df-88203d4bb481)
      - In the "New principals" text box, enter `allUsers`, and select a role "Storage Object Viewer". *Note: you can create an even more locked down role by creating a custom role with only `storage.objects.get` permissions and assign it to `allUsers`. The "Storage Object Viewer" role has list objects which you may not want to expose.*
      ![image](https://github.com/user-attachments/assets/0bfa1981-ef7a-4a1f-93e7-d9edb37c9afa)

      - This allows the Vertex AI service to access your media files and display the assets in the Shop The Look frontend. 

# Command-line Help

Both scripts support command-line help. You can view the available options and their descriptions by running:

```
python image_embedding_processor.py --help

python video_embedding_processor.py --help
```

This will display all available command-line arguments and their descriptions.

# Image Embedding Processor

This script processes images from Google Cloud Storage, generates embeddings using Vertex AI, and upserts them to a Pinecone index.

## Usage

Run the script with the following command:

```
python image_embedding_processor.py -p <gc-project-id> -b <gcs-bucket-name> -f <gcs-folder-name> -i <pinecone-index-name>
```

Replace the placeholders with your actual values:
- `<gc-project-id>`: Your Google Cloud project ID
- `<gcs-bucket-name>`: The name of your GCS bucket containing the images
- `<gcs-folder-name>`: The folder name within the bucket where images are stored
- `<pinecone-index-name>`: The name of your Pinecone index

## Notes

- Supports image formats: jpeg, jpg, png, bmp, gif
- Uses exponential backoff for retrying failed operations (max 5 attempts)
- Ensure your Google Cloud service account has necessary permissions

For more detailed instructions, refer to the comments in the script file.

# Video Embedding Processor

This script processes videos from Google Cloud Storage, generates embeddings using Vertex AI, and upserts them to a Pinecone index.

## Usage

Run the script with the following command:

```
python video_embedding_processor.py -p <gc-project-id> -b <gcs-bucket-name> -f <gcs-folder-name> -i <pinecone-index-name>
```

Replace the placeholders with your actual values:
- `<gc-project-id>`: Your Google Cloud project ID
- `<gcs-bucket-name>`: The name of your GCS bucket containing the videos
- `<gcs-folder-name>`: The folder name within the bucket where videos are stored
- `<pinecone-index-name>`: The name of your Pinecone index

## Notes

- Supports video formats: mov, mp4, avi, flv, mkv, mpeg, mpg, webm, wmv
- Uses exponential backoff for retrying failed operations (max 5 attempts)
- Processes videos in segments, with configurable interval and offset settings
- Ensure your Google Cloud service account has necessary permissions
- Video embedding settings (INTERVAL_SEC, START_OFFSET_SEC, END_OFFSET_SEC) can be adjusted in the script

For more detailed instructions, refer to the comments in the script file. 
