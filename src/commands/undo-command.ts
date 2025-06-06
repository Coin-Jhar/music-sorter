// src/commands/undo-command.ts
import { Command } from 'commander';
import { FileOperations } from '../utils/file-operations';
import { settingsManager } from '../config/settings-manager';
import path from 'path';
import fs from 'fs/promises';
import { logger } from '../utils/logger';

export function undoCommand(program: Command): void {
  program
    .command('undo')
    .description('Undo sorting and move all files back to source directory')
    .action(async () => {
      try {
        logger.info('Undoing previous sort operation...');
        const fileOps = new FileOperations();

        // Load settings to get paths
        await settingsManager.initialize();
        const { sourcePath, targetPath } = await settingsManager.getAll();

        // Make sure source directory exists
        await fileOps.ensureDirectoryExists(sourcePath);

        // Scan all files in sorted directory
        const sortedFiles = await fileOps.scanDirectory(targetPath);
        logger.info(`Found ${sortedFiles.length} sorted files.`);

        // Move each file back to source
        for (const filePath of sortedFiles) {
          const fileName = path.basename(filePath);
          const destPath = path.join(sourcePath, fileName);

          try {
            await fs.rename(filePath, destPath);
            logger.info(`Restored: ${fileName}`);
          } catch (error) {
            logger.error(`Error restoring file ${fileName}:`, error as Error);
          }
        }

        logger.success('Undo operation complete!');
      } catch (error) {
        logger.error('Error during undo operation:', error as Error);
      }
    });
}
