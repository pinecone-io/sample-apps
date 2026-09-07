import fs from 'fs';
import path from 'path';

enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG',
  START = 'START'
}

class Logger {
  private static instance: Logger;
  private isServer: boolean;
  private logDir: string;
  private logFile: string;

  private constructor() {
    this.isServer = typeof window === 'undefined';
    this.logDir = path.join(process.cwd(), 'logs');
    this.logFile = '';

    if (this.isServer) {
      try {
        if (!fs.existsSync(this.logDir)) {
          fs.mkdirSync(this.logDir, { recursive: true });
        }
        const now = new Date();
        const timestamp = now.toISOString().split('T')[0]; // Format: YYYY-MM-DD
        this.logFile = path.join(this.logDir, `${timestamp}.log`);
        
        // Only create a new file if the server is starting (not on hot reloads)
        if (process.env.SERVER_STARTUP === 'true' && !fs.existsSync(this.logFile)) {
          fs.writeFileSync(this.logFile, '');
          console.log(`Log file created: ${this.logFile}`);
        }
      } catch (error) {
        console.error(`Failed to set up logging: ${error}`);
      }
    }
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private log(level: LogLevel, message: string) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level}] ${message}`;

    if (this.isServer) {
      console.log(logEntry);
      try {
        fs.appendFileSync(this.logFile, logEntry + '\n');
      } catch (error) {
        console.error(`Failed to write to log file: ${error}`);
      }
    } else {
      console.log(logEntry);
    }
  }

  info(message: string) {
    this.log(LogLevel.INFO, message);
  }

  warn(message: string) {
    this.log(LogLevel.WARN, message);
  }

  error(message: string) {
    this.log(LogLevel.ERROR, message);
  }

  debug(message: string) {
    this.log(LogLevel.DEBUG, message);
  }

  serviceStart(message: string = 'Service has fully started') {
    this.log(LogLevel.START, message);
  }
}

export const logger = Logger.getInstance();
