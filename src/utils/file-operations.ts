// src/utils/file-operations.ts
import fs from 'fs/promises';
import path from 'path';
import { PATHS } from '../config/constants';

export class FileOperations {
  async ensureDirectoryExists(dir: string): Promise<void> {
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  async scanDirectory(dir: string = PATHS.SOURCE): Promise<string[]> {
    await this.ensureDirectoryExists(dir);
    
    const allFiles: string[] = [];
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        const subFiles = await this.scanDirectory(fullPath);
        allFiles.push(...subFiles);
      } else {
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
      console.log(`Moved: ${path.basename(sourcePath)} -> ${targetPath}`);
    } catch (error) {
      console.error(`Error moving file ${sourcePath}:`, error);
    }
  }

  async copyFile(sourcePath: string, destPath: string): Promise<void> {
    const targetPath = path.join(PATHS.TARGET, destPath);
    const destDir = path.dirname(targetPath);
    
    await this.ensureDirectoryExists(destDir);
    
    try {
      await fs.copyFile(sourcePath, targetPath);
      console.log(`Copied: ${path.basename(sourcePath)} -> ${targetPath}`);
    } catch (error) {
      console.error(`Error copying file ${sourcePath}:`, error);
    }
  }
}
