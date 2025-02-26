// src/commands/sort-command.ts
import { Command } from 'commander';
import { MusicSorter } from '../core/sorter';
import { MetadataService } from '../services/metadata-service';
import { FileOperations } from '../utils/file-operations';
import { PATHS } from '../config/constants';
import { logger } from '../utils/logger';

export function sortCommand(program: Command): void {
  program
    .command('sort')
    .description('Sort music files')
    .option('-s, --source <path>', 'Source directory', PATHS.SOURCE)
    .option('-d, --destination <path>', 'Destination directory', PATHS.TARGET)
    .option('-p, --pattern <pattern>', 'Sorting pattern (artist, album-artist, album, genre, year)', 'artist')
    .option('-c, --copy', 'Copy files instead of moving them', false)
    .action(async (options) => {
      logger.info(`Starting music sorter...`);
      logger.info(`Source: ${options.source}`);
      logger.info(`Destination: ${options.destination}`);
      logger.info(`Pattern: ${options.pattern}`);
      logger.info(`Copy mode: ${options.copy ? 'Yes' : 'No'}`);
      
      try {
        const fileOps = new FileOperations();
        const metadataService = new MetadataService();
        const musicSorter = new MusicSorter(fileOps);
        
        // Make sure target directory exists
        await fileOps.ensureDirectoryExists(options.destination);
        
        logger.info('Scanning files...');
        const files = await fileOps.scanDirectory(options.source);
        logger.info(`Found ${files.length} files.`);
        
        logger.info('Extracting metadata...');
        const musicFiles = await metadataService.extractMetadata(files);
        logger.info(`Processed ${musicFiles.length} music files.`);
        
        switch (options.pattern) {
          case 'artist':
            await musicSorter.sortByArtist(musicFiles, options.copy);
            break;
          case 'album-artist':
            await musicSorter.sortByAlbumArtist(musicFiles, options.copy);
            break;
          case 'album':
            await musicSorter.sortByAlbum(musicFiles, options.copy);
            break;
          case 'genre':
            await musicSorter.sortByGenre(musicFiles, options.copy);
            break;
          case 'year':
            await musicSorter.sortByYear(musicFiles, options.copy);
            break;
          default:
            logger.error(`Unknown pattern: ${options.pattern}`);
        }
        
        logger.success('Sorting complete!');
      } catch (error) {
        logger.error('Error during sorting:', error as Error);
      }
    });
}
