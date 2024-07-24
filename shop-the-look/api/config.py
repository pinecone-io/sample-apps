import os
import base64
from datetime import datetime, timedelta
from google.oauth2 import service_account
from google.auth.transport.requests import Request

class Settings:
    def __init__(self):
        # Google services
        self.project_id = os.getenv('GOOGLE_CLOUD_PROJECT_ID')
        self.location = os.getenv('GOOGLE_CLOUD_PROJECT_LOCATION')
        self.gcs_bucket_name = os.getenv('GOOGLE_CLOUD_STORAGE_BUCKET_NAME')
        self.google_credentials_base64 = os.getenv('GOOGLE_CREDENTIALS_BASE64')
        self.credentials_path = os.getenv('GOOGLE_APPLICATION_CREDENTIALS') or '/tmp/google-credentials.json'
        self.access_token = None
        self.token_expiry = None
        self.credentials = None

        # Pinecone services
        self.api_key = os.getenv('PINECONE_API_KEY')
        self.index_name = os.getenv('PINECONE_INDEX_NAME')
        self.k = int(os.getenv('PINECONE_TOP_K')) 
    
    def get_credentials(self):
        if self.credentials:
            return self.credentials

        try:
            # Case 1: Using GOOGLE_CREDENTIALS_BASE64
            if self.google_credentials_base64:
                print("Loading Google credentials from GOOGLE_CREDENTIALS_BASE64")
                google_credentials = base64.b64decode(self.google_credentials_base64).decode('utf-8')
                with open(self.credentials_path, 'w') as f:
                    f.write(google_credentials)
                os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = self.credentials_path
                credential_source = "GOOGLE_CREDENTIALS_BASE64"

            # Case 2: Using existing service account JSON file
            elif os.path.exists(self.credentials_path):
                credential_source = "GOOGLE_APPLICATION_CREDENTIALS file"

            # Case 3: No credentials available
            else:
                raise ValueError("Google credentials not found. Please set GOOGLE_CREDENTIALS_BASE64 or ensure GOOGLE_APPLICATION_CREDENTIALS points to a valid file.")

            # Load credentials from the file (works for both Case 1 and Case 2)
            self.credentials = service_account.Credentials.from_service_account_file(
                self.credentials_path,
                scopes=['https://www.googleapis.com/auth/cloud-platform']
            )
            print(f"Successfully loaded Google credentials from {credential_source}")
            return self.credentials

        except Exception as e:
            error_message = (
                f"Failed to load Google service account credentials: {str(e)}\n"
                f"Attempted to load credentials from: {credential_source}\n"
                "Please ensure you have set up a Google Cloud service account correctly.\n"
                "For instructions on setting up a service account, visit:\n"
                "https://cloud.google.com/docs/authentication/getting-started"
            )
            raise ValueError(error_message) from e

    def get_access_token(self):
        if self.access_token and self.token_expiry and datetime.now() < self.token_expiry:
            return self.access_token

        try:
            credentials = self.get_credentials()
            credentials.refresh(Request())
            self.access_token = credentials.token
            self.token_expiry = datetime.now() + timedelta(hours=1)
            print("Access token refreshed", self.access_token)
            return self.access_token
        except Exception as e:
            print(f"Error getting access token: {str(e)}")
            return None

    def get_embedding_request_data(self, access_token, content_type, content):
        """
        Prepares the request data for the multimodal embedding API.

        :param access_token: The access token for authentication
        :param content_type: The type of content ('text', 'image', or 'video')
        :param content: The actual content (query string for text, base64 encoded string for image/video)
        :return: A tuple containing the URL, headers, and data for the API request
        """
        url = f"https://{self.location}-aiplatform.googleapis.com/v1/projects/{self.project_id}/locations/{self.location}/publishers/google/models/multimodalembedding@001:predict"
        
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }

        instance = {}
        if content_type == 'text':
            instance["text"] = content
        elif content_type in ['image', 'video']:
            instance[content_type] = {"bytesBase64Encoded": content}
        else:
            raise ValueError(f"Unsupported content type: {content_type}")

        data = {
            "instances": [instance]
        }

        return url, headers, data
settings = Settings()
