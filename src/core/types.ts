// src/core/types.ts
export interface ServiceOptions {
  verbose?: boolean;
}

// src/core/base-service.ts
import { ServiceOptions } from './types';
import { logger } from '../utils/logger';

export abstract class BaseService {
  protected verbose: boolean;
  
  constructor(options: ServiceOptions = {}) {
    this.verbose = options.verbose || false;
  }
  
  protected log(message: string): void {
    if (this.verbose) {
      logger.info(message);
    }
  }
  
  protected error(message: string, error?: Error): void {
    logger.error(message, error);
  }
  
  protected warn(message: string): void {
    logger.warn(message);
  }
  
  protected success(message: string): void {
    logger.success(message);
  }
}
