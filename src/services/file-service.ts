// src/services/file-service.ts
import fs from 'fs/promises';
import path from 'path';
import { BaseService } from '../core/base-service';
import { ServiceOptions } from '../core/types';
import { PATHS } from '../config/constants';

export class FileService extends BaseService {
  constructor(options: ServiceOptions = {}) {
    super(options);
  }
  
  async ensureDirectoryExists(dir: string): Promise<void> {
    try {
      await fs.access(dir);
      this.log(`Directory exists: ${dir}`);
    } catch {
      this.log(`Creating directory: ${dir}`);
      await fs.mkdir(dir, { recursive: true });
    }
  }
  
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
  
  async moveFile(sourcePath: string, destPath: string): Promise<void> {
    const targetPath = path.join(PATHS.TARGET, destPath);
    const destDir = path.dirname(targetPath);
    
    await this.ensureDirectoryExists(destDir);
    
    try {
      await fs.rename(sourcePath, targetPath);
      this.success(`Moved: ${path.basename(sourcePath)} -> ${targetPath}`);
    } catch (error) {
      this.error(`Error moving file ${sourcePath}:`, error as Error);
      throw error;
    }
  }
  
  async copyFile(sourcePath: string, destPath: string): Promise<void> {
    const targetPath = path.join(PATHS.TARGET, destPath);
    const destDir = path.dirname(targetPath);
    
    await this.ensureDirectoryExists(destDir);
    
    try {
      await fs.copyFile(sourcePath, targetPath);
      this.success(`Copied: ${path.basename(sourcePath)} -> ${targetPath}`);
    } catch (error) {
      this.error(`Error copying file ${sourcePath}:`, error as Error);
      throw error;
    }
  }
}
