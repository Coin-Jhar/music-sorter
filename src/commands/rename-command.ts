// src/commands/rename-command.ts
import { Command } from 'commander';
import { MetadataService } from '../services/metadata-service';
import { FileService } from '../services/file-service';
import { APP_CONFIG } from '../config/app-config';
import { MusicFile } from '../models/music-file';
import { logger } from '../utils/logger';
import { formatTemplate, sanitizeFilename } from '../utils/string-utils';
import path from 'path';
import fs from 'fs/promises';

export function renameCommand(program: Command): void {
  program
    .command('rename')
    .description('Rename music files based on metadata')
    .option('-s, --source <path>', 'Source directory', APP_CONFIG.PATHS.SOURCE)
    .option('-p, --pattern <pattern>', 'Naming pattern', '{artist} - {title}')
    .option('-d, --dry-run', 'Preview changes without renaming', false)
    .action(async (options) => {
      try {
        logger.info(`Starting batch rename operation...`);
        logger.info(`Source: ${options.source}`);
        logger.info(`Pattern: ${options.pattern}`);
        logger.info(`Dry run: ${options.dryRun ? 'Yes' : 'No'}`);
        
        const fileService = new FileService({ verbose: false });
        const metadataService = new MetadataService();
        
        logger.info('Scanning files...');
        const files = await fileService.scanDirectory(options.source);
        logger.info(`Found ${files.length} files.`);
        
        logger.info('Extracting metadata...');
        const musicFiles = await metadataService.extractMetadata(files);
        logger.info(`Processed ${musicFiles.length} music files.`);
        
        await renameByMetadata(musicFiles, options.pattern, options.dryRun);
        
        logger.success('Rename operation complete!');
      } catch (error) {
        logger.error('Error during rename operation:', error as Error);
      }
    });
}

async function renameByMetadata(
  musicFiles: MusicFile[], 
  pattern: string, 
  dryRun: boolean = false
): Promise<void> {
  let renamed = 0;
  let skipped = 0;
  
  for (const file of musicFiles) {
    // Skip files with insufficient metadata
    if (!file.metadata.artist && !file.metadata.title) {
      logger.warn(`Skipping ${file.filename}: Insufficient metadata`);
      skipped++;
      continue;
    }
    
    // Replace pattern placeholders
    const templateValues = {
      artist: file.metadata.artist || 'Unknown',
      title: file.metadata.title || 'Unknown',
      album: file.metadata.album || 'Unknown',
      year: file.metadata.year,
      track: file.metadata.trackNumber ? 
        file.metadata.trackNumber.toString().padStart(2, '0') : undefined
    };
    
    let newName = formatTemplate(pattern, templateValues);
    
    // Sanitize filename
    newName = sanitizeFilename(newName);
    
    // Add original extension
    newName += file.extension;
    
    // Path for new file
    const dirPath = path.dirname(file.path);
    const newPath = path.join(dirPath, newName);
    
    if (dryRun) {
      logger.info(`Would rename: ${file.filename} -> ${newName}`);
      renamed++;
    } else {
      try {
        // Check if target file already exists
        try {
          await fs.access(newPath);
          logger.warn(`Skipping ${file.filename}: Target file already exists`);
          skipped++;
        } catch {
          // File doesn't exist, safe to rename
          await fs.rename(file.path, newPath);
          logger.success(`Renamed: ${file.filename} -> ${newName}`);
          renamed++;
        }
      } catch (error) {
        logger.error(`Error renaming ${file.filename}:`, error as Error);
        skipped++;
      }
    }
  }
  
  logger.info(`Summary: ${renamed} files renamed, ${skipped} files skipped.`);
}

// Add rename command to the registry in command-registry.ts
import { renameCommand } from './rename-command';
// ...
export function setupCommands(program: Command): void {
  sortCommand(program);
  undoCommand(program);
  renameCommand(program); // Added rename command
}
