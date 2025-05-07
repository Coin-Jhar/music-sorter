// src/core/base-service.ts
import { ServiceOptions } from './types';
import { logger } from '../utils/logger';
import { AppError, ErrorCategory, createAppError } from '../utils/error-handler';

/**
 * Base service class that provides common functionality
 * for all service classes
 */
export abstract class BaseService {
  protected verbose: boolean;
  protected readonly serviceName: string;
  
  constructor(options: ServiceOptions = {}) {
    this.verbose = options.verbose || false;
    this.serviceName = this.constructor.name;
  }
  
  /**
   * Log an informational message if verbose is enabled
   */
  protected log(message: string): void {
    if (this.verbose) {
      logger.info(`[${this.serviceName}] ${message}`);
    }
  }
  
  /**
   * Log a debug message if verbose is enabled
   */
  protected debug(message: string): void {
    if (this.verbose) {
      logger.debug(`[${this.serviceName}] ${message}`);
    }
  }
  
  /**
   * Log an error message
   */
  protected error(message: string, error?: Error): void {
    logger.error(`[${this.serviceName}] ${message}`, error);
  }
  
  /**
   * Log a warning message
   */
  protected warn(message: string): void {
    logger.warn(`[${this.serviceName}] ${message}`);
  }
  
  /**
   * Log a success message
   */
  protected success(message: string): void {
    logger.success(`[${this.serviceName}] ${message}`);
  }
  
  /**
   * Create and throw an application error
   */
  protected throwError(
    category: ErrorCategory,
    message: string,
    originalError?: Error,
    context?: Record<string, any>
  ): never {
    throw createAppError(
      category,
      `[${this.serviceName}] ${message}`,
      originalError,
      context
    );
  }
  
  /**
   * Execute a function with standardized error handling
   */
  protected async executeWithErrorHandling<T>(
    operation: string,
    func: () => Promise<T>,
    errorCategory: ErrorCategory = ErrorCategory.UNKNOWN
  ): Promise<T> {
    try {
      return await func();
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      
      this.throwError(
        errorCategory,
        `Error during ${operation}: ${(error as Error).message}`,
        error as Error
      );
    }
  }
  
  /**
   * Set verbose mode
   */
  setVerbose(verbose: boolean): void {
    this.verbose = verbose;
  }
}
