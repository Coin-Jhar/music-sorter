// src/utils/file-operations.ts
import fs from 'fs/promises';
import path from 'path';
import { PATHS } from '../config/constants';
import { logger } from './logger';
import { AppError, ErrorCategory, createAppError } from './error-handler';

export class FileOperations {
  private verbose: boolean;
  private operationCounters: {
    moved: number;
    copied: number;
    failed: number;
  };
  private operationBatchSize: number = 50;
  private activeOperations: Promise<void>[] = [];
  private targetRoot: string;

  constructor(verbose = false, batchSize = 50, targetRoot = PATHS.TARGET) {
    this.verbose = verbose;
    this.operationBatchSize = batchSize;
    this.targetRoot = targetRoot;
    this.operationCounters = {
      moved: 0,
      copied: 0,
      failed: 0
    };
  }

  /**
   * Reset operation counters
   */
  resetCounters(): void {
    this.operationCounters = {
      moved: 0,
      copied: 0,
      failed: 0
    };
  }

  /**
   * Set the target root directory
   */
  setTargetRoot(targetRoot: string): void {
    this.targetRoot = targetRoot;
  }

  /**
   * Get operation statistics
   */
  getOperationStats(): typeof this.operationCounters {
    return { ...this.operationCounters };
  }

  /**
   * Log a message if verbose mode is enabled
   */
  private log(message: string): void {
    if (this.verbose) {
      logger.info(message);
    }
  }

  /**
   * Ensure a directory exists, creating it if necessary
   */
  async ensureDirectoryExists(dir: string): Promise<void> {
    try {
      await fs.access(dir);
      this.log(`Directory exists: ${dir}`);
    } catch {
      this.log(`Creating directory: ${dir}`);
      try {
        await fs.mkdir(dir, { recursive: true });
      } catch (error) {
        throw createAppError(
          ErrorCategory.FILE_OPERATION,
          `Failed to create directory: ${dir}`,
          error as Error,
          { path: dir }
        );
      }
    }
  }

  /**
   * Check if a file exists
   */
  async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Scan a directory recursively for files with support for ignored patterns
   */
  async scanDirectory(
    dir: string = PATHS.SOURCE, 
    options: { 
      recursive?: boolean;
      ignorePatterns?: RegExp[];
      includeHidden?: boolean;
    } = {}
  ): Promise<string[]> {
    const {
      recursive = true,
      ignorePatterns = [],
      includeHidden = false
    } = options;
    
    this.log(`Scanning directory: ${dir}`);
    
    try {
      await this.ensureDirectoryExists(dir);
      
      const allFiles: string[] = [];
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        // Skip hidden files/directories if not included
        if (!includeHidden && entry.name.startsWith('.')) {
          continue;
        }
        
        const fullPath = path.join(dir, entry.name);
        
        // Skip paths matching ignore patterns
        if (ignorePatterns.some(pattern => pattern.test(fullPath))) {
          this.log(`Skipping ignored path: ${fullPath}`);
          continue;
        }
        
        if (entry.isDirectory() && recursive) {
          this.log(`Found subdirectory: ${entry.name}`);
          const subFiles = await this.scanDirectory(fullPath, options);
          allFiles.push(...subFiles);
        } else if (entry.isFile()) {
          this.log(`Found file: ${entry.name}`);
          allFiles.push(fullPath);
        }
      }
      
      return allFiles;
    } catch (error) {
      throw createAppError(
        ErrorCategory.FILE_OPERATION,
        `Failed to scan directory: ${dir}`,
        error as Error,
        { path: dir }
      );
    }
  }

  /**
   * Move a file to a destination path
   */
  async moveFile(sourcePath: string, destRelativePath: string, targetRoot?: string): Promise<void> {
    const actualTargetRoot = targetRoot || this.targetRoot;
    const targetPath = path.join(actualTargetRoot, destRelativePath);
    const destDir = path.dirname(targetPath);
    
    try {
      await this.ensureDirectoryExists(destDir);
      
      // Check if the source file exists
      if (!(await this.fileExists(sourcePath))) {
        throw new Error(`Source file does not exist: ${sourcePath}`);
      }
      
      // Check if destination already exists
      if (await this.fileExists(targetPath)) {
        // Generate unique filename
        const parsedPath = path.parse(targetPath);
        const newTargetPath = path.join(
          parsedPath.dir, 
          `${parsedPath.name}_${Date.now()}${parsedPath.ext}`
        );
        await fs.rename(sourcePath, newTargetPath);
        logger.info(`Moved (renamed): ${path.basename(sourcePath)} -> ${newTargetPath}`);
      } else {
        await fs.rename(sourcePath, targetPath);
        logger.info(`Moved: ${path.basename(sourcePath)} -> ${targetPath}`);
      }
      
      this.operationCounters.moved++;
    } catch (error) {
      this.operationCounters.failed++;
      logger.error(`Error moving file ${sourcePath}: ${error instanceof Error ? error.message : String(error)}`);
      throw createAppError(
        ErrorCategory.FILE_OPERATION,
        `Failed to move file: ${sourcePath} to ${targetPath}`,
        error as Error,
        { sourcePath, targetPath }
      );
    }
  }

  /**
   * Queue multiple file operations and execute them in batches
   */
  async queueOperation(operation: () => Promise<void>): Promise<void> {
    this.activeOperations.push(operation());
    
    if (this.activeOperations.length >= this.operationBatchSize) {
      await this.processBatch();
    }
  }

  /**
   * Process a batch of operations
   */
  private async processBatch(): Promise<void> {
    if (this.activeOperations.length === 0) return;
    
    await Promise.allSettled(this.activeOperations);
    this.activeOperations = [];
  }

  /**
   * Wait for all queued operations to complete
   */
  async flushQueue(): Promise<void> {
    await this.processBatch();
  }

  /**
   * Copy a file to a destination path
   */
  async copyFile(sourcePath: string, destRelativePath: string, targetRoot?: string): Promise<void> {
    const actualTargetRoot = targetRoot || this.targetRoot;
    const targetPath = path.join(actualTargetRoot, destRelativePath);
    const destDir = path.dirname(targetPath);
    
    try {
      await this.ensureDirectoryExists(destDir);
      
      // Check if the source file exists
      if (!(await this.fileExists(sourcePath))) {
        throw new Error(`Source file does not exist: ${sourcePath}`);
      }
      
      // Check if destination already exists
      if (await this.fileExists(targetPath)) {
        // Generate unique filename
        const parsedPath = path.parse(targetPath);
        const newTargetPath = path.join(
          parsedPath.dir, 
          `${parsedPath.name}_${Date.now()}${parsedPath.ext}`
        );
        await fs.copyFile(sourcePath, newTargetPath);
        logger.info(`Copied (renamed): ${path.basename(sourcePath)} -> ${newTargetPath}`);
      } else {
        await fs.copyFile(sourcePath, targetPath);
        logger.info(`Copied: ${path.basename(sourcePath)} -> ${targetPath}`);
      }
      
      this.operationCounters.copied++;
    } catch (error) {
      this.operationCounters.failed++;
      logger.error(`Error copying file ${sourcePath}: ${error instanceof Error ? error.message : String(error)}`);
      throw createAppError(
        ErrorCategory.FILE_OPERATION,
        `Failed to copy file: ${sourcePath} to ${targetPath}`,
        error as Error,
        { sourcePath, targetPath }
      );
    }
  }
  
  /**
   * Delete a file
   */
  async deleteFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
      this.log(`Deleted: ${filePath}`);
    } catch (error) {
      logger.error(`Error deleting file ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
      throw createAppError(
        ErrorCategory.FILE_OPERATION,
        `Failed to delete file: ${filePath}`,
        error as Error,
        { path: filePath }
      );
    }
  }
  
  /**
   * Create a file with content (useful for testing)
   */
  async createFile(filePath: string, content: string | Buffer = ''): Promise<void> {
    try {
      const dirPath = path.dirname(filePath);
      await this.ensureDirectoryExists(dirPath);
      await fs.writeFile(filePath, content);
      this.log(`Created file: ${filePath}`);
    } catch (error) {
      logger.error(`Error creating file ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
      throw createAppError(
        ErrorCategory.FILE_OPERATION,
        `Failed to create file: ${filePath}`,
        error as Error,
        { path: filePath }
      );
    }
  }
}