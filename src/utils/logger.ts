// src/utils/logger.ts
import fs from 'fs';
import path from 'path';
import os from 'os';

/**
 * Log levels
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  SUCCESS = 2,
  WARN = 3,
  ERROR = 4,
  NONE = 5
}

/**
 * ANSI color codes for terminal output
 */
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  
  // Foreground colors
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  
  // Background colors
  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m'
};

interface LoggerOptions {
  level?: LogLevel;
  useColors?: boolean;
  logToFile?: boolean;
  logFilePath?: string;
  timestampFormat?: string;
}

class Logger {
  private level: LogLevel;
  private useColors: boolean;
  private logToFile: boolean;
  private logFilePath: string;
  private timestampFormat: string;
  private logFile?: fs.WriteStream;
  
  constructor(options: LoggerOptions = {}) {
    this.level = options.level ?? LogLevel.INFO;
    this.useColors = options.useColors ?? true;
    this.logToFile = options.logToFile ?? false;
    this.logFilePath = options.logFilePath ?? path.join(os.homedir(), '.music-sorter', 'logs', 'app.log');
    this.timestampFormat = options.timestampFormat ?? 'YYYY-MM-DD HH:mm:ss';
    
    if (this.logToFile) {
      this.initLogFile();
    }
  }
  
  /**
   * Initialize log file
   */
  private initLogFile(): void {
    try {
      // Ensure directory exists
      const logDir = path.dirname(this.logFilePath);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      
      // Open log file in append mode
      this.logFile = fs.createWriteStream(this.logFilePath, { flags: 'a' });
      
      // Write log file header
      const header = `\n----- Log started at ${this.getTimestamp()} -----\n`;
      this.logFile.write(header);
    } catch (error) {
      console.error('Failed to initialize log file:', error);
      this.logToFile = false;
    }
  }
  
  /**
   * Format a timestamp
   */
  private getTimestamp(): string {
    const now = new Date();
    
    // Simple timestamp format implementation
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    return this.timestampFormat
      .replace('YYYY', year.toString())
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds);
  }
  
  /**
   * Log a message
   */
  private log(level: LogLevel, message: string, error?: Error): void {
    if (level < this.level) return;
    
    const timestamp = this.getTimestamp();
    const levelStr = LogLevel[level];
    
    // Format log message
    let logMessage = `[${timestamp}] [${levelStr}] ${message}`;
    
    // Add error details if provided
    if (error) {
      logMessage += `\n${error.stack || error.message}`;
    }
    
    // Terminal output with colors
    if (this.useColors) {
      let colorCode = colors.reset;
      
      switch (level) {
        case LogLevel.DEBUG:
          colorCode = colors.dim;
          break;
        case LogLevel.INFO:
          colorCode = colors.blue;
          break;
        case LogLevel.SUCCESS:
          colorCode = colors.green;
          break;
        case LogLevel.WARN:
          colorCode = colors.yellow;
          break;
        case LogLevel.ERROR:
          colorCode = colors.red;
          break;
      }
      
      console.log(`${colorCode}[${timestamp}] [${levelStr}] ${message}${colors.reset}`);
      
      if (error) {
        console.error(`${colors.red}${error.stack || error.message}${colors.reset}`);
      }
    } else {
      console.log(logMessage);
    }
    
    // Log to file if enabled
    if (this.logToFile && this.logFile) {
      this.logFile.write(logMessage + '\n');
    }
  }
  
  /**
   * Set log level
   */
  setLevel(level: LogLevel): void {
    this.level = level;
  }
  
  /**
   * Set color mode
   */
  setColorMode(useColors: boolean): void {
    this.useColors = useColors;
  }
  
  /**
   * Enable or disable file logging
   */
  setFileLogging(enabled: boolean, filePath?: string): void {
    this.logToFile = enabled;
    
    if (filePath) {
      this.logFilePath = filePath;
    }
    
    if (enabled && !this.logFile) {
      this.initLogFile();
    }
  }
  
  /**
   * Log a debug message
   */
  debug(message: string): void {
    this.log(LogLevel.DEBUG, message);
  }
  
  /**
   * Log an info message
   */
  info(message: string): void {
    this.log(LogLevel.INFO, message);
  }
  
  /**
   * Log a success message
   */
  success(message: string): void {
    this.log(LogLevel.SUCCESS, message);
  }
  
  /**
   * Log a warning message
   */
  warn(message: string): void {
    this.log(LogLevel.WARN, message);
  }
  
  /**
   * Log an error message
   */
  error(message: string, error?: Error): void {
    this.log(LogLevel.ERROR, message, error);
  }
  
  /**
   * Close logger and resources
   */
  close(): Promise<void> {
    return new Promise((resolve) => {
      if (this.logFile) {
        const footer = `----- Log closed at ${this.getTimestamp()} -----\n`;
        this.logFile.write(footer, () => {
          this.logFile?.end(() => {
            this.logFile = undefined;
            resolve();
          });
        });
      } else {
        resolve();
      }
    });
  }
}

// Export a singleton instance
export const logger = new Logger();
