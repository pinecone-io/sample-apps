import requests
from bs4 import BeautifulSoup
from openai import OpenAI
from datetime import datetime
import json
from logger_config import logger
import os
import uuid

client = OpenAI(api_key=os.environ.get('OPENAI_API_KEY'))

def get_embeddings(content, timestamp):
    logger.debug(f"Getting embeddings for content: {content[:50]}...")
    try:
        response = client.embeddings.create(
            input=content,
            model="text-embedding-3-small"
        )
        embedding = response.data[0].embedding
        logger.debug("Successfully generated embeddings")
        return embedding
    except Exception as e:
        logger.error(f"Error calling OpenAI embedding API: {e}")
        raise

def validate_embeddings(embeddings):
    if not isinstance(embeddings, list):
        raise ValueError("Embeddings is not a list")
    
    try:
        validated_embeddings = [float(value) for value in embeddings]
        return validated_embeddings
    except ValueError as e:
        logger.error(f"Error converting embedding values to float: {e}")
        raise ValueError("Embedding contains non-float values")

def fetch_article_body(url):
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Look for the main article content
        article_body = soup.find('article')
        if article_body:
            # Remove unwanted elements
            for unwanted in article_body.find_all(['script', 'style', 'nav', 'header', 'footer']):
                unwanted.decompose()
            
            # Extract text from paragraphs
            paragraphs = article_body.find_all('p')
            content = ' '.join([p.get_text(strip=True) for p in paragraphs])
            return content[:4000]  # Limit to first 4000 characters
        else:
            logger.warning(f"Could not find article body for URL: {url}")
            return ""
    except Exception as e:
        logger.error(f"Error fetching article body: {e}")
        return ""

def transform_rss_message(message):
    logger.info(f"Transforming RSS message: {message.get('title', 'No title')}")
    
    try:
        # Parse the date string to a datetime object
        date_str = message.get('date')
        if date_str:
            date_obj = datetime.strptime(date_str, "%Y-%m-%dT%H:%M:%SZ")
            timestamp = int(date_obj.timestamp())
        else:
            timestamp = int(datetime.now().timestamp())

        # Fetch the article body (already limited to 4000 characters)
        article_body = fetch_article_body(message.get('link', ''))

        # Prepare content for embedding and chunk
        title = message.get('title', '')
        chunk = f"{title}\n\n{article_body}"
        
        # Get and validate embeddings
        embeddings = validate_embeddings(get_embeddings(chunk, timestamp))

        # Prepare metadata
        metadata = {
            "title": title,
            "link": message.get('link', '') or '',
            "description": message.get('content', '')[:500] or '',  # Limit description to 500 characters
            "source": message.get('feed', {}).get('title', '') or '',
            "published_at": timestamp or 0,
            "author": message.get('author', '') or '',
            "categories": message.get('categories', []) or [],
            "chunk": chunk  # This now contains the truncated article body
        }

        # Remove any keys with empty string values
        metadata = {k: v for k, v in metadata.items() if v != ''}

        # Upsert vector to Pinecone
        #from upsert_vectors import upsert_to_pinecone
        #upsert_to_pinecone(message.get('id', '') or str(uuid.uuid4()), embeddings, metadata)

        transformed_message = {
            "id": message.get('id', '') or str(uuid.uuid4()),  # Generate a UUID if id is missing
            "metadata": json.dumps(metadata),
            "values": embeddings
        }
        
        # Use the article URL as the key
        key = message.get('link', '')

        logger.info(f"Transformed message: {transformed_message['id']}")
        return transformed_message, key
    except Exception as e:
        logger.error(f"Error transforming RSS message: {e}")
        raise

if __name__ == "__main__":
    # Test the transformer
    test_message = {
        "id": "test_id",
        "title": "Test Title",
        "content": "Test Content",
        "link": "https://example.com",
        "date": "2023-09-14T12:00:00Z",
        "author": "Test Author",
        "feed": {
            "title": "Test Feed",
            "url": "https://example.com/feed"
        }
    }
    transform_rss_message(test_message)
