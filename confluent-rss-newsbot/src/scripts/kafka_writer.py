from confluent_kafka import Producer
from confluent_kafka.serialization import StringSerializer, SerializationContext, MessageField
import json
from logger_config import logger
import os

config = {
    'bootstrap.servers': os.environ.get('CONFLUENT_BOOTSTRAP_SERVERS', ''),
    'security.protocol': 'SASL_SSL',
    'sasl.mechanisms': 'PLAIN',
    'sasl.username': os.environ.get('CONFLUENT_API_KEY', ''),
    'sasl.password': os.environ.get('CONFLUENT_API_SECRET', '')
}

output_topic = os.environ.get('CONFLUENT_OUTPUT_TOPIC', '')

json_serializer = StringSerializer('utf-8')

def json_serializer(obj):
    return json.dumps(obj).encode('utf-8')

def delivery_report(err, msg):
    if err is not None:
        logger.error(f'Message delivery failed: {err}')
    else:
        logger.info(f'Message delivered to {msg.topic()} [{msg.partition()}]')

def write_to_kafka(message, key):
    producer = Producer(config)
    
    try:
        # Ensure the message is in the correct format
        kafka_message = {
            "id": message["id"],
            "metadata": json.loads(message["metadata"]),  # Parse the JSON string back to a dict
            "values": message["values"]
        }
        
        # Serialize the entire message as JSON
        serialized_message = json.dumps(kafka_message).encode('utf-8')
        
        # Produce message to topic with the provided key
        producer.produce(
            topic=output_topic,
            key=key.encode('utf-8'),  # Encode the key as bytes
            value=serialized_message,
            on_delivery=delivery_report
        )
        
        # Wait for any outstanding messages to be delivered and delivery reports received
        producer.flush()
        
    except Exception as e:
        logger.error(f'Error in write_to_kafka: {e}')
        raise

    logger.info(f'Message written to Kafka topic: {output_topic} with key: {key}')

if __name__ == "__main__":
    # Test the writer
    test_message = {"test": "message"}
    write_to_kafka(test_message, "test_key")
