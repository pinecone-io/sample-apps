from confluent_kafka import Consumer, KafkaError, KafkaException
import json
from logger_config import logger
import os
import time
import uuid
import base64

def get_kafka_config():
    logger.info(f"ENVIRONMENT: {os.environ.get('ENVIRONMENT')}")
    
    if os.environ.get('ENVIRONMENT') == 'development':
        group_id = f'rss-poller-group-{uuid.uuid4()}'
        logger.info(f"Running in development environment. Using unique consumer group ID: {group_id}")
    else:
        group_id = os.environ.get('KAFKA_CONSUMER_GROUP_ID', 'rss-poller-group-default')
        logger.info(f"Running in production environment. Using consumer group ID: {group_id}")

    return {
        'bootstrap.servers': os.environ.get('CONFLUENT_BOOTSTRAP_SERVERS', ''),
        'group.id': group_id,
        'auto.offset.reset': 'earliest',
        'security.protocol': 'SASL_SSL',
        'sasl.mechanisms': 'PLAIN',
        'sasl.username': os.environ.get('CONFLUENT_API_KEY', ''),
        'sasl.password': os.environ.get('CONFLUENT_API_SECRET', ''),
        'enable.auto.commit': False
    }

def start_kafka_polling(message_handler, max_messages=100):
    logger.info("Starting Kafka polling")
    
    config = get_kafka_config()
    input_topic = os.environ.get('CONFLUENT_INPUT_TOPIC', '')
    
    consumer = None
    try:
        consumer = Consumer(config)
        consumer.subscribe([input_topic])
        logger.info(f"Consumer subscribed to topic: {input_topic}")

        message_count = 0
        start_time = time.time()

        while message_count < max_messages:
            try:
                msg = consumer.poll(1.0)
                
                if msg is None:
                    if time.time() - start_time > 30:
                        logger.info("No more messages received. Stopping.")
                        break
                    continue

                if msg.error():
                    if msg.error().code() == KafkaError._PARTITION_EOF:
                        logger.debug("Reached end of partition")
                    else:
                        logger.error(f"Consumer error: {msg.error()}")
                        break
                else:
                    raw_message = msg.value()
                    logger.debug(f"Raw message (base64): {base64.b64encode(raw_message).decode('utf-8')}")
                    
                    # Remove null bytes and the Start of Heading character
                    decoded_message = raw_message.replace(b'\x00', b'').replace(b'\x01', b'').decode('utf-8', errors='ignore')
                    logger.debug(f"Decoded message: {decoded_message}")
                    
                    cleaned_message = decoded_message.strip().lstrip('\ufeff')
                    logger.info(f'Cleaned message: {cleaned_message[:100]}...')
                    
                    try:
                        message = json.loads(cleaned_message)
                        logger.info(f"Successfully parsed JSON. Keys: {list(message.keys())}")
                        message_handler(message)
                        message_count += 1
                    except json.JSONDecodeError as e:
                        logger.error(f"Failed to parse JSON: {e}")
                        logger.error(f"Error position: {e.pos}")
                        logger.error(f"Error line and column: {e.lineno}:{e.colno}")
                        logger.error(f"Full cleaned message: {cleaned_message}")
                        
                        # If JSON parsing fails, log the problematic characters
                        logger.error(f"Problematic characters: {[ord(c) for c in cleaned_message[:20]]}")

                    consumer.commit(msg)

            except KafkaException as ke:
                logger.error(f"Kafka exception during polling: {ke}")
                break
            except Exception as e:
                logger.error(f"Unexpected error during polling: {e}")
                break

        logger.info(f"Finished polling. Processed {message_count} messages.")

    except KafkaException as e:
        logger.error(f"Kafka exception occurred during setup: {e}")
    except Exception as e:
        logger.error(f"Unexpected error in Kafka polling setup: {e}")
    finally:
        logger.info("Closing Kafka consumer")
        if consumer:
            consumer.close()

if __name__ == "__main__":
    def dummy_message_handler(message):
        logger.info(f"Processed message: {message}")

    start_kafka_polling(dummy_message_handler, max_messages=100)
