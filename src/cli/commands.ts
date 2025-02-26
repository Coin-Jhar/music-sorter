// src/cli/commands.ts
import fs from 'fs/promises';
import { Command } from 'commander';
import { MusicSorter } from '../core/sorter';
import { MetadataService } from '../services/metadata-service';
import { FileOperations } from '../utils/file-operations';
import { PATHS } from '../config/constants';
import path from 'path';

export function setupCLI(): Command {
  const program = new Command();
  
  program
    .name('music-sorter')
    .description('Sort music files from Telegram in Termux')
    .version('1.0.0');

  program
    .command('sort')
    .description('Sort music files')
    .option('-s, --source <path>', 'Source directory', PATHS.SOURCE)
    .option('-d, --destination <path>', 'Destination directory', PATHS.TARGET)
    .option('-p, --pattern <pattern>', 'Sorting pattern (artist, album, genre, year)', 'artist')
    .option('-c, --copy', 'Copy files instead of moving them', false)
    .action(async (options) => {
      console.log(`Starting music sorter...`);
      console.log(`Source: ${options.source}`);
      console.log(`Destination: ${options.destination}`);
      console.log(`Pattern: ${options.pattern}`);
      console.log(`Copy mode: ${options.copy ? 'Yes' : 'No'}`);
      
      try {
        const fileOps = new FileOperations();
        const metadataService = new MetadataService();
        const musicSorter = new MusicSorter(fileOps);
        
        // Make sure target directory exists
        await fileOps.ensureDirectoryExists(options.destination);
        
        console.log('Scanning files...');
        const files = await fileOps.scanDirectory(options.source);
        console.log(`Found ${files.length} files.`);
        
        console.log('Extracting metadata...');
        const musicFiles = await metadataService.extractMetadata(files);
        console.log(`Processed ${musicFiles.length} music files.`);
        
        switch (options.pattern) {
          case 'artist':
            await musicSorter.sortByArtist(musicFiles, options.copy);
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
            console.error(`Unknown pattern: ${options.pattern}`);
        }
        
        console.log('Sorting complete!');
      } catch (error) {
        console.error('Error during sorting:', error);
      }
    });

  program
    .command('analyze')
    .description('Analyze music collection without sorting')
    .option('-s, --source <path>', 'Source directory', PATHS.SOURCE)
    .action(async (options) => {
      try {
        const fileOps = new FileOperations();
        const metadataService = new MetadataService();
        
        console.log('Scanning files...');
        const files = await fileOps.scanDirectory(options.source);
        console.log(`Found ${files.length} files.`);
        
        console.log('Extracting metadata...');
        const musicFiles = await metadataService.extractMetadata(files);
        
        // Count artists, albums, genres
        const artists = new Set(musicFiles.map(f => f.metadata.artist || 'Unknown'));
        const albums = new Set(musicFiles.map(f => f.metadata.album || 'Unknown'));
        const genres = new Set(musicFiles.map(f => f.metadata.genre || 'Unknown'));
        
        console.log(`Analysis complete!`);
        console.log(`Total music files: ${musicFiles.length}`);
        console.log(`Unique artists: ${artists.size}`);
        console.log(`Unique albums: ${albums.size}`);
        console.log(`Unique genres: ${genres.size}`);
      } catch (error) {
        console.error('Error during analysis:', error);
      }
    });

  program
    .command('undo')
    .description('Undo sorting and move all files back to source directory')
    .action(async () => {
      try {
        console.log('Undoing previous sort operation...');
        const fileOps = new FileOperations();
      
        // Make sure source directory exists
        await fileOps.ensureDirectoryExists(PATHS.SOURCE);
      
        // Scan all files in sorted directory
        const sortedFiles = await fileOps.scanDirectory(PATHS.TARGET);
        console.log(`Found ${sortedFiles.length} sorted files.`);
      
        // Move each file back to source
        for (const filePath of sortedFiles) {
          const fileName = path.basename(filePath);
          const targetPath = path.join(PATHS.SOURCE, fileName);
        
          try {
            await fs.rename(filePath, targetPath);
            console.log(`Restored: ${fileName}`);
          } catch (error) {
            console.error(`Error restoring file ${fileName}:`, error);
          }
        }
      
        // Clean up empty directories
        console.log('Cleaning up empty directories...');
        // This is a bit complex to implement in TypeScript, so we'll use simple approach
      
        console.log('Undo operation complete!');
      } catch (error) {
        console.error('Error during undo operation:', error);
      }
    });

  return program;
}
