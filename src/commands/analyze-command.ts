// src/commands/analyze-command.ts
import { Command } from 'commander';
import { FileOperations } from '../utils/file-operations';
import { MetadataService } from '../services/metadata-service';
import { logger } from '../utils/logger';
import { settingsManager } from '../config/settings-manager';
import { PATHS } from '../config/constants';

export function analyzeCommand(program: Command): void {
  const analyze = program
    .command('analyze')
    .description('Analyze music collection without sorting')
    .option('-s, --source <path>', 'Source directory', PATHS.SOURCE)
    .action(async (options) => {
      try {
        // Load settings first
        await settingsManager.initialize();
        
        // Use settings as defaults if source is not provided or is the default
        const settings = await settingsManager.getAll();
        const sourcePath = options.source === PATHS.SOURCE 
          ? settings.sourcePath 
          : options.source;
        
        logger.info(`Analyzing music collection in ${sourcePath}...`);
        
        const fileOps = new FileOperations(true); // Enable verbose mode
        const metadataService = new MetadataService();
        
        logger.info('Scanning files...');
        const files = await fileOps.scanDirectory(sourcePath);
        logger.info(`Found ${files.length} files.`);
        
        logger.info('Extracting metadata...');
        const musicFiles = await metadataService.extractMetadata(files);
        
        // Count artists, albums, genres, years
        const artists = new Set(musicFiles.map(f => f.metadata.artist || 'Unknown'));
        const albums = new Set(musicFiles.map(f => f.metadata.album || 'Unknown'));
        const genres = new Set(musicFiles.map(f => f.metadata.genre || 'Unknown'));
        const years = new Set(musicFiles.map(f => f.metadata.year?.toString()).filter(Boolean));
        
        // Count files by format
        const formatCounts: Record<string, number> = {};
        for (const file of musicFiles) {
          const ext = file.extension.toLowerCase();
          formatCounts[ext] = (formatCounts[ext] || 0) + 1;
        }
        
        // Calculate total size
        const totalSizeMB = musicFiles.reduce((sum, file) => sum + file.size, 0) / (1024 * 1024);
        
        // Print summary
        logger.info('\n📊 Analysis Results:');
        logger.info('====================');
        logger.info(`Total music files: ${musicFiles.length}`);
        logger.info(`Total size: ${totalSizeMB.toFixed(2)} MB`);
        logger.info(`Unique artists: ${artists.size}`);
        logger.info(`Unique albums: ${albums.size}`);
        logger.info(`Unique genres: ${genres.size}`);
        logger.info(`Years span: ${years.size > 0 ? `${Math.min(...Array.from(years).map(Number))} - ${Math.max(...Array.from(years).map(Number))}` : 'Unknown'}`);
        
        // Format counts
        logger.info('\n📁 Files by Format:');
        for (const [ext, count] of Object.entries(formatCounts)) {
          logger.info(`${ext}: ${count} files`);
        }
        
        logger.success('Analysis complete!');
      } catch (error) {
        logger.error('Error during analysis:', error as Error);
      }
    });
}
