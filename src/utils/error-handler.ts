// src/utils/error-handler.ts
import { logger } from './logger';

export enum ErrorCategory {
  FILE_OPERATION = 'FileOperation',
  METADATA_EXTRACTION = 'MetadataExtraction',
  SETTINGS = 'Settings',
  SERVER = 'Server',
  UNKNOWN = 'Unknown'
}

export interface ErrorDetails {
  category: ErrorCategory;
  message: string;
  originalError?: Error;
  context?: Record<string, any>;
}

export class AppError extends Error {
  public category: ErrorCategory;
  public context?: Record<string, any>;
  public originalError?: Error;

  constructor({ category, message, originalError, context }: ErrorDetails) {
    super(message);
    this.name = 'AppError';
    this.category = category;
    this.originalError = originalError;
    this.context = context;
    
    // Ensure stack trace is captured correctly
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}

export function handleError(error: Error | AppError, operation: string): never {
  if (error instanceof AppError) {
    logger.error(`[${error.category}] ${operation}: ${error.message}`);
    if (error.context) {
      logger.error(`Context: ${JSON.stringify(error.context)}`);
    }
    if (error.originalError) {
      logger.error(`Original error: ${error.originalError.message}`);
      logger.error(error.originalError.stack || '');
    }
  } else {
    logger.error(`Error during ${operation}: ${error.message}`);
    logger.error(error.stack || '');
  }
  
  throw error;
}

export function createAppError(
  category: ErrorCategory,
  message: string,
  originalError?: Error,
  context?: Record<string, any>
): AppError {
  return new AppError({
    category,
    message,
    originalError,
    context
  });
}
