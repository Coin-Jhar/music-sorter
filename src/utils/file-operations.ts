// src/utils/file-operations.ts
import fs from 'fs/promises';
import path from 'path';
import { PATHS } from '../config/constants';
import { logger } from './logger';

export class FileOperations {
  private verbose: boolean;

  constructor(verbose = false) {
    this.verbose = verbose;
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
      await fs.mkdir(dir, { recursive: true });
    }
  }

  /**
   * Scan a directory recursively for files
   */
  async scanDirectory(dir: string = PATHS.SOURCE, recursive = true): Promise<string[]> {
    this.log(`Scanning directory: ${dir}`);
    await this.ensureDirectoryExists(dir);
    
    const allFiles: string[] = [];
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory() && recursive) {
        this.log(`Found subdirectory: ${entry.name}`);
        const subFiles = await this.scanDirectory(fullPath, recursive);
        allFiles.push(...subFiles);
      } else if (entry.isFile()) {
        this.log(`Found file: ${entry.name}`);
        allFiles.push(fullPath);
      }
    }
    
    return allFiles;
  }

  /**
   * Move a file to a destination path
   */
  async moveFile(sourcePath: string, destPath: string, targetRoot = PATHS.TARGET): Promise<void> {
    const targetPath = path.join(targetRoot, destPath);
    const destDir = path.dirname(targetPath);
    
    await this.ensureDirectoryExists(destDir);
    
    try {
      await fs.rename(sourcePath, targetPath);
      logger.info(`Moved: ${path.basename(sourcePath)} -> ${targetPath}`);
    } catch (error) {
      logger.error(`Error moving file ${sourcePath}:`, error as Error);
    }
  }

  /**
   * Copy a file to a destination path
   */
  async copyFile(sourcePath: string, destPath: string, targetRoot = PATHS.TARGET): Promise<void> {
    const targetPath = path.join(targetRoot, destPath);
    const destDir = path.dirname(targetPath);
    
    await this.ensureDirectoryExists(destDir);
    
    try {
      await fs.copyFile(sourcePath, targetPath);
      logger.info(`Copied: ${path.basename(sourcePath)} -> ${targetPath}`);
    } catch (error) {
      logger.error(`Error copying file ${sourcePath}:`, error as Error);
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
      logger.error(`Error deleting file ${filePath}:`, error as Error);
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
}
