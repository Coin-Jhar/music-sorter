// src/tests/integration-test.ts
import path from 'path';
import fs from 'fs/promises';
import { FileOperations } from '../utils/file-operations';
import { MetadataService } from '../services/metadata-service';
import { MusicSorter } from '../core/sorter';
import { settingsManager } from '../config/settings-manager';
import { logger, LogLevel } from '../utils/logger';
import { SortPattern, SortOptions, SortProgressInfo } from '../models/music-file';
import { generateTestData } from './generate-test-data';
import { AppError, ErrorCategory } from '../utils/error-handler';

// Set up logging
logger.setLevel(LogLevel.DEBUG);
logger.setFileLogging(true, './integration-test.log');

/**
 * Integration test for the entire music sorter application
 */
async function runIntegrationTest() {
  logger.info('=== Starting Music Sorter Integration Test ===');
  
  // Step 1: Generate test data
  const testDir = await generateTestData();
  const sourceDir = path.join(testDir, 'source');
  const targetDir = path.join(testDir, 'target');
  
  try {
    // Create target directory
    await fs.mkdir(targetDir, { recursive: true });
    
    logger.info('Test data generated successfully.');
    
    // Step 2: Initialize services
    const fileOps = new FileOperations(true);
    const metadataService = new MetadataService({ verbose: true });
    const musicSorter = new MusicSorter(fileOps, { verbose: true });
    
    // Set test paths in settings
    await settingsManager.initialize();
    await settingsManager.updateSettings({
      sourcePath: sourceDir,
      targetPath: targetDir
    });
    
    // Log settings
    const settings = await settingsManager.getAll();
    logger.info(`Settings configured: ${JSON.stringify(settings)}`);
    
    // Step 3: Scan source directory
    logger.info('Scanning source directory...');
    const files = await fileOps.scanDirectory(sourceDir);
    logger.info(`Found ${files.length} files in source directory.`);
    
    // Step 4: Extract metadata
    logger.info('Extracting metadata...');
    // Since we're using empty files, we'll use the extractFromFilename option
    const musicFiles = await metadataService.extractMetadata(files, {
      extractFromFilename: true,
      allowIncompleteMetadata: true
    });
    logger.info(`Extracted metadata for ${musicFiles.length} files.`);
    
    // Override metadata with test data since we're using empty files
    musicFiles.forEach(file => {
      const filename = file.filename;
      
      if (filename.startsWith('artist1_album1')) {
        file.metadata = {
          artist: 'Artist One',
          album: 'Album One',
          title: filename.includes('track1') ? 'Track 1' : 'Track 2',
          trackNumber: filename.includes('track1') ? 1 : 2,
          genre: 'Rock',
          year: 2020
        };
      } else if (filename.startsWith('artist2')) {
        file.metadata = {
          artist: 'Artist Two',
          album: 'Album One',
          title: 'Track 1',
          trackNumber: 1,
          genre: 'Pop',
          year: 2021
        };
      } else if (filename.startsWith('artist1_album2')) {
        file.metadata = {
          artist: 'Artist One',
          album: 'Album Two',
          title: 'Track 1',
          trackNumber: 1,
          genre: 'Jazz',
          year: 2022
        };
      }
    });
    
    // Step 5: Test different sort patterns
    const sortPatterns = [
      SortPattern.ARTIST,
      SortPattern.ALBUM,
      SortPattern.GENRE,
      SortPattern.YEAR
    ];
    
    // Add progress tracking
    // Fix for TypeScript error - explicitly typing the parameter
    const progressCallback = (progress: SortProgressInfo): void => {
      logger.debug(`Sort progress: ${progress.processed}/${progress.total} files`);
    };
    
    for (const pattern of sortPatterns) {
      // Clear target directory before each test
      try {
        await fs.rm(targetDir, { recursive: true });
      } catch (error) {
        // Ignore if directory doesn't exist
      }
      await fs.mkdir(targetDir, { recursive: true });
      
      // Configure sort options
      const sortOptions: SortOptions = {
        pattern,
        copyMode: true,
        nestedStructure: true,
        includeArtistInAlbumFolder: true,
        progressCallback
      };
      
      logger.info(`Testing sort pattern: ${pattern}...`);
      
      // Sort the files
      await musicSorter.sortFiles(musicFiles, sortOptions);
      
      // Check results
      const sortedFiles = await fileOps.scanDirectory(targetDir);
      logger.info(`Sorted ${sortedFiles.length} files with pattern: ${pattern}`);
      
      // Print directory structure for visual inspection
      await printDirectoryStructure(targetDir);
    }
    
    // Step 6: Test custom pattern
    logger.info('Testing custom sort pattern...');
    
    // Clear target directory
    try {
      await fs.rm(targetDir, { recursive: true });
    } catch (error) {
      // Ignore if directory doesn't exist
    }
    await fs.mkdir(targetDir, { recursive: true });
    
    // Configure custom sort options
    const customSortOptions: SortOptions = {
      pattern: SortPattern.CUSTOM,
      copyMode: true,
      nestedStructure: true,
      includeArtistInAlbumFolder: true,
      template: '{year}/{genre}/{artist}/{album}/{track}-{title}',
      progressCallback
    };
    
    // Sort with custom pattern
    await musicSorter.sortFiles(musicFiles, customSortOptions);
    
    // Check results
    const customSortedFiles = await fileOps.scanDirectory(targetDir);
    logger.info(`Sorted ${customSortedFiles.length} files with custom pattern.`);
    
    // Print directory structure for custom pattern
    await printDirectoryStructure(targetDir);
    
    // Step 7: Test error handling
    logger.info('Testing error handling...');
    
    // Test with invalid pattern
    try {
      const invalidOptions: SortOptions = {
        pattern: 'invalid-pattern' as unknown as SortPattern,
        copyMode: true,
        nestedStructure: true,
        includeArtistInAlbumFolder: true
      };
      
      await musicSorter.sortFiles(musicFiles, invalidOptions);
      throw new Error('Expected error for invalid pattern, but none was thrown.');
    } catch (error) {
      if (error instanceof AppError && error.category === ErrorCategory.FILE_OPERATION) {
        logger.success('Successfully caught error for invalid sort pattern.');
      } else {
        throw error;
      }
    }
    
    // Test with invalid paths
    try {
      const invalidFile = { ...musicFiles[0], path: '/nonexistent/path.mp3' };
      
      await musicSorter.sortFiles([invalidFile], {
        pattern: SortPattern.ARTIST,
        copyMode: true,
        nestedStructure: true,
        includeArtistInAlbumFolder: true
      });
      
      // This should fail since we updated the FileOperations to throw errors for invalid files
      throw new Error('Expected error for nonexistent file, but none was thrown.');
    } catch (error) {
      if (error instanceof AppError) {
        logger.success('Successfully caught error for nonexistent file.');
      } else {
        throw error;
      }
    }
    
    // Step 8: Test settings persistence
    logger.info('Testing settings persistence...');
    
    // Change a setting
    const customSourcePath = path.join(testDir, 'custom-source');
    await settingsManager.set('sourcePath', customSourcePath);
    
    // Check if setting was persisted
    const updatedSettings = await settingsManager.getAll();
    
    if (updatedSettings.sourcePath !== customSourcePath) {
      throw new Error('Settings were not persisted correctly.');
    }
    
    logger.success('Settings persistence test passed.');
    
    // Step 9: Test album-artist sorting
    logger.info('Testing album-artist sorting...');
    
    // Clear target directory
    try {
      await fs.rm(targetDir, { recursive: true });
    } catch (error) {
      // Ignore if directory doesn't exist
    }
    await fs.mkdir(targetDir, { recursive: true });
    
    // Update some files with albumArtist metadata
    const filesWithAlbumArtist = musicFiles.map(file => {
      if (file.filename.includes('artist1_album1')) {
        return {
          ...file,
          metadata: {
            ...file.metadata,
            albumArtist: 'Various Artists',  // Different from artist
            artist: 'Artist One'
          }
        };
      }
      return file;
    });
    
    // Configure album-artist sort options
    const albumArtistSortOptions: SortOptions = {
      pattern: SortPattern.ALBUM_ARTIST,
      copyMode: true,
      nestedStructure: true,
      includeArtistInAlbumFolder: true,
      progressCallback
    };
    
    // Sort by album artist
    await musicSorter.sortFiles(filesWithAlbumArtist, albumArtistSortOptions);
    
    // Check results
    const albumArtistSortedFiles = await fileOps.scanDirectory(targetDir);
    logger.info(`Sorted ${albumArtistSortedFiles.length} files by album artist.`);
    
    // Print directory structure for album artist sort
    await printDirectoryStructure(targetDir);
    
    // Final success message
    logger.success('=== Integration Test Completed Successfully ===');
    return true;
  } catch (error) {
    logger.error(`Integration test failed: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  } finally {
    // Clean up test directory if needed
    // Uncomment to keep test data for inspection
    // await fs.rm(testDir, { recursive: true, force: true });
  }
}

/**
 * Helper function to print directory structure
 */
async function printDirectoryStructure(dir: string, indent: string = ''): Promise<void> {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const entryPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        logger.debug(`${indent}📁 ${entry.name}/`);
        await printDirectoryStructure(entryPath, indent + '  ');
      } else {
        logger.debug(`${indent}📄 ${entry.name}`);
      }
    }
  } catch (error) {
    logger.error(`Error reading directory ${dir}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  runIntegrationTest()
    .then(success => {
      if (success) {
        console.log('Integration test completed successfully.');
        process.exit(0);
      } else {
        console.error('Integration test failed.');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Unhandled error in integration test:', error);
      process.exit(1);
    });
}

export { runIntegrationTest };