// src/commands/rename-command.ts
import { Command } from 'commander';
import fs from 'fs/promises';
import path from 'path';
import { FileOperations } from '../utils/file-operations';
import { MetadataService } from '../services/metadata-service';
import { PATHS } from '../config/constants';
import { logger } from '../utils/logger';
import { formatTemplate, sanitizeFilename } from '../utils/string-utils';
import { MusicFile } from '../models/music-file';
import { settingsManager } from '../config/settings-manager';

export function renameCommand(program: Command): void {
  program
    .command('rename')
    .description('Rename music files based on their metadata')
    .option('-s, --source <path>', 'Source directory')
    .option('-p, --pattern <pattern>', 'Rename pattern (e.g., "{artist} - {title}")')
    .option('-d, --dry-run', 'Preview changes without renaming files', false)
    .action(async (options) => {
      try {
        // Load settings first
        await settingsManager.initialize();
        
        // Use settings as defaults if options are not provided
        const settings = await settingsManager.getAll();
        const sourcePath = options.source || settings.sourcePath;
        const pattern = options.pattern || settings.defaultRenamePattern;
        
        logger.info(`Starting file renaming...`);
        logger.info(`Source: ${sourcePath}`);
        logger.info(`Pattern: ${pattern}`);
        logger.info(`Dry run: ${options.dryRun ? 'Yes' : 'No'}`);
        
        const fileOps = new FileOperations();
        const metadataService = new MetadataService();
        
        logger.info('Scanning files...');
        const files = await fileOps.scanDirectory(sourcePath);
        logger.info(`Found ${files.length} files.`);
        
        logger.info('Extracting metadata...');
        const musicFiles = await metadataService.extractMetadata(files);
        logger.info(`Processed ${musicFiles.length} music files.`);
        
        let renamedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;
        
        // Keep track of new filenames to avoid conflicts
        const usedFilenames = new Set<string>();
        
        for (const file of musicFiles) {
          try {
            const newFilename = generateFilename(file, pattern);
            const dir = path.dirname(file.path);
            const newPath = path.join(dir, newFilename + file.extension);
            
            // Check if new filename already exists or has been used in this session
            const normalizedNewPath = path.normalize(newPath);
            if (normalizedNewPath === path.normalize(file.path)) {
              logger.info(`Skipping ${file.filename} (already has correct name)`);
              skippedCount++;
              continue;
            }
            
            // Handle potential filename conflicts
            let finalNewPath = newPath;
            let counter = 1;
            while (await fileExists(finalNewPath) || usedFilenames.has(finalNewPath)) {
              // Add counter to filename to make it unique
              finalNewPath = path.join(dir, `${newFilename} (${counter})${file.extension}`);
              counter++;
            }
            
            usedFilenames.add(finalNewPath);
            
            if (options.dryRun) {
              logger.info(`Would rename: ${file.filename} -> ${path.basename(finalNewPath)}`);
              renamedCount++;
            } else {
              await fs.rename(file.path, finalNewPath);
              logger.success(`Renamed: ${file.filename} -> ${path.basename(finalNewPath)}`);
              renamedCount++;
            }
          } catch (error) {
            logger.error(`Error renaming ${file.filename}:`, error as Error);
            errorCount++;
          }
        }
        
        if (options.dryRun) {
          logger.info(`Dry run complete. ${renamedCount} files would be renamed, ${skippedCount} would be skipped, ${errorCount} errors.`);
        } else {
          logger.success(`Renaming complete! ${renamedCount} files renamed, ${skippedCount} skipped, ${errorCount} errors.`);
        }
      } catch (error) {
        logger.error('Error during renaming:', error as Error);
      }
    });
}

// Helper function to check if a file exists
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

// Generate a new filename based on the pattern and metadata
function generateFilename(file: MusicFile, pattern: string): string {
  const { metadata } = file;
  const values = {
    artist: metadata.artist || 'Unknown Artist',
    albumArtist: metadata.albumArtist || metadata.artist || 'Unknown Artist',
    album: metadata.album || 'Unknown Album',
    title: metadata.title || path.basename(file.filename, file.extension),
    genre: metadata.genre || 'Unknown Genre',
    year: metadata.year?.toString() || 'Unknown Year',
    track: metadata.trackNumber?.toString().padStart(2, '0') || '00',
  };
  
  // Generate filename from pattern and sanitize it
  const filename = formatTemplate(pattern, values);
  return sanitizeFilename(filename);
}
