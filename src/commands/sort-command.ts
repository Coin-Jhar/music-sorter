// src/commands/sort-command.ts
import { Command } from 'commander';
import { MusicSorter } from '../core/sorter';
import { MetadataService } from '../services/metadata-service';
import { FileOperations } from '../utils/file-operations';
import { PATHS } from '../config/constants';
import { logger } from '../utils/logger';
import { settingsManager } from '../config/settings-manager';
import { SortOptions } from '../models/music-file';
import { buildSortOptions } from '../utils/sort-utils';

export function sortCommand(program: Command): void {
  program
    .command('sort')
    .description('Sort music files')
    .option('-s, --source <path>', 'Source directory', PATHS.SOURCE)
    .option('-d, --destination <path>', 'Destination directory', PATHS.TARGET)
    .option('-p, --pattern <pattern>', 'Sorting pattern (artist, album-artist, album, genre, year)', 'artist')
    .option('-c, --copy', 'Copy files instead of moving them', false)
    .action(async (options) => {
      try {
        // Load settings first
        await settingsManager.initialize();
        
        // Use settings as defaults if options are not provided
        const settings = await settingsManager.getAll();
        const sourcePath = options.source === PATHS.SOURCE ? settings.sourcePath : options.source;
        const destPath = options.destination === PATHS.TARGET ? settings.targetPath : options.destination;
        const pattern = options.pattern || settings.defaultSortPattern;
        const copyMode = options.copy !== undefined ? options.copy : settings.copyByDefault;
        
        logger.info(`Starting music sorter...`);
        logger.info(`Source: ${sourcePath}`);
        logger.info(`Destination: ${destPath}`);
        logger.info(`Pattern: ${pattern}`);
        logger.info(`Copy mode: ${copyMode ? 'Yes' : 'No'}`);
        
        // Save the last used pattern
        await settingsManager.set('lastUsedPattern', pattern);
        
        const fileOps = new FileOperations();
        const metadataService = new MetadataService();
        const musicSorter = new MusicSorter(fileOps);
        
        // Make sure target directory exists
        await fileOps.ensureDirectoryExists(destPath);
        
        logger.info('Scanning files...');
        const files = await fileOps.scanDirectory(sourcePath);
        logger.info(`Found ${files.length} files.`);
        
        logger.info('Extracting metadata...');
        const musicFiles = await metadataService.extractMetadata(files);
        logger.info(`Processed ${musicFiles.length} music files.`);

        const sortOptions: SortOptions = buildSortOptions(pattern, copyMode);

        await musicSorter.sortFiles(musicFiles, sortOptions);

        logger.success('Sorting complete!');
      } catch (error) {
        logger.error('Error during sorting:', error as Error);
      }
    });
}
