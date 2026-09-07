import os
from dotenv import load_dotenv
from pathlib import Path
from logger_config import logger
from kafka_poller import start_kafka_polling
from rss_transformer import transform_rss_message
from kafka_writer import write_to_kafka

def load_env():
    env_path = Path('.') / '.env.local'
    if env_path.exists():
        load_dotenv(env_path)
        os.environ['ENVIRONMENT'] = 'development'
        logger.info("Loaded .env.local file. Running in development environment.")
    else:
        env_path = Path('.') / '.env'
        if env_path.exists():
            load_dotenv(env_path)
            logger.info("Loaded .env file.")
        else:
            raise FileNotFoundError("No .env or .env.local file found.")

def main():
    try:
        load_env()
    except FileNotFoundError as e:
        logger.error(f"Environment file error: {e}")
        return

    logger.info("START: Backend server is starting")
    import time
    import signal

    def signal_handler(signum, frame):
        logger.info("Interrupt received, shutting down...")
        raise KeyboardInterrupt

    signal.signal(signal.SIGINT, signal_handler)

    while True:
        try:
            logger.info("Starting Kafka polling service")
            try:
                start_kafka_polling(message_handler)
            except Exception as e:
                logger.error(f"Error starting Kafka polling service: {e}")
                break
            time.sleep(300)
        except KeyboardInterrupt:
            logger.info("Keyboard interrupt received, shutting down...")
            break
        except Exception as e:
            logger.error(f"Error in main server loop: {e}")
            break

    logger.info("STOP: Backend server is shutting down")

def message_handler(message):
    try:
        transformed_message, key = transform_rss_message(message)
        write_to_kafka(transformed_message, key)
    except Exception as e:
        logger.error(f"Error handling message: {e}")

if __name__ == "__main__":
    main()
