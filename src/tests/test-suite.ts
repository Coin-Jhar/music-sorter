// src/tests/test-suite.ts
import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';
import { FileOperations } from '../utils/file-operations';
import { MetadataService } from '../services/metadata-service';
import { MusicSorter } from '../core/sorter';
import { settingsManager } from '../config/settings-manager';
import { logger, LogLevel } from '../utils/logger';
import { SortPattern, SortOptions } from '../models/music-file';
import { createAppError, ErrorCategory, AppError } from '../utils/error-handler';

// Configure logger for testing
logger.setLevel(LogLevel.DEBUG);
logger.setFileLogging(true, './test-logs.log');

/**
 * Test Suite for Music Sorter
 */
class MusicSorterTestSuite {
  private testDir: string;
  private sourceDir: string;
  private targetDir: string;
  private fileOps: FileOperations;
  private metadataService: MetadataService;
  private musicSorter: MusicSorter;
  private sampleFiles: Map<string, Buffer> = new Map();

  constructor() {
    this.testDir = path.join(process.cwd(), 'test-env');
    this.sourceDir = path.join(this.testDir, 'source');
    this.targetDir = path.join(this.testDir, 'target');
    
    // Initialize services with verbose mode for testing
    this.fileOps = new FileOperations(true);
    this.metadataService = new MetadataService({ verbose: true });
    this.musicSorter = new MusicSorter(this.fileOps, { verbose: true });
    
    // Set up sample MP3 files with test metadata
    this.setupSampleFiles();
  }

  /**
   * Set up sample MP3 file data for testing
   */
  private setupSampleFiles() {
    // This would normally read real MP3 files, but for this test we'll create empty files
    // and simulate the metadata extraction process
    
    // Sample file 1: Artist with album
    this.sampleFiles.set('artist1_album1_track1.mp3', Buffer.from([]));
    this.sampleFiles.set('artist1_album1_track2.mp3', Buffer.from([]));
    
    // Sample file 2: Different artist
    this.sampleFiles.set('artist2_album1_track1.mp3', Buffer.from([]));
    
    // Sample file 3: Same artist, different album
    this.sampleFiles.set('artist1_album2_track1.mp3', Buffer.from([]));
    
    // Sample file 4: No metadata/incomplete
    this.sampleFiles.set('unknown_track.mp3', Buffer.from([]));
  }

  /**
   * Set up test environment
   */
  async setupTestEnvironment() {
    logger.info('Setting up test environment...');
    
    try {
      // Clean up previous test directory if it exists
      try {
        await fs.rm(this.testDir, { recursive: true, force: true });
      } catch (error) {
        // Ignore if directory doesn't exist
      }
      
      // Create test directories
      await fs.mkdir(this.sourceDir, { recursive: true });
      await fs.mkdir(this.targetDir, { recursive: true });
      
      // Create sample files
      for (const [filename, content] of this.sampleFiles.entries()) {
        const filePath = path.join(this.sourceDir, filename);
        await fs.writeFile(filePath, content);
      }
      
      logger.success('Test environment set up successfully.');
      return true;
    } catch (error) {
      logger.error(`Failed to set up test environment: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  /**
   * Clean up test environment
   */
  async cleanupTestEnvironment() {
    logger.info('Cleaning up test environment...');
    
    try {
      await fs.rm(this.testDir, { recursive: true, force: true });
      logger.success('Test environment cleaned up successfully.');
    } catch (error) {
      logger.error(`Failed to clean up test environment: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Run file operations tests
   */
  async testFileOperations() {
    logger.info('Testing FileOperations...');
    
    try {
      // Test scanning directory
      const files = await this.fileOps.scanDirectory(this.sourceDir);
      logger.info(`Found ${files.length} files in source directory.`);
      
      if (files.length !== this.sampleFiles.size) {
        throw new Error(`Expected ${this.sampleFiles.size} files, but found ${files.length}.`);
      }
      
      // Test file existence check
      const firstFile = files[0];
      const exists = await this.fileExists(firstFile);
      
      if (!exists) {
        throw new Error(`File existence check failed for ${firstFile}.`);
      }
      
      // Test directory creation
      const testSubDir = path.join(this.targetDir, 'subdir', 'nested');
      await this.fileOps.ensureDirectoryExists(testSubDir);
      
      // Verify directory was created
      const dirStats = await fs.stat(testSubDir);
      if (!dirStats.isDirectory()) {
        throw new Error(`Failed to create directory: ${testSubDir}.`);
      }
      
      // Test file copy
      const sourceFile = files[0];
      const destFile = path.join(testSubDir, path.basename(sourceFile));
      await this.fileOps.copyFile(sourceFile, path.relative(this.targetDir, destFile), this.targetDir);
      
      // Verify file was copied
      const destExists = await this.fileExists(destFile);
      if (!destExists) {
        throw new Error(`Failed to copy file to ${destFile}.`);
      }
      
      logger.success('FileOperations tests passed!');
      return true;
    } catch (error) {
      logger.error(`FileOperations tests failed: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  /**
   * Run metadata service tests using mocked metadata
   */
  async testMetadataService() {
    logger.info('Testing MetadataService...');
    
    try {
      // Mock the parseMetadata method temporarily for testing
      const originalParseMethod = (this.metadataService as any).parseMetadata;
      
      // Override with mock implementation
      (this.metadataService as any).parseMetadata = async (filePath: string) => {
        const basename = path.basename(filePath);
        
        // Return mock metadata based on filename
        if (basename.startsWith('artist1_album1')) {
          return {
            artist: 'Artist One',
            album: 'Album One',
            title: basename.includes('track1') ? 'Track 1' : 'Track 2',
            trackNumber: basename.includes('track1') ? 1 : 2,
            genre: 'Rock'
          };
        } else if (basename.startsWith('artist2')) {
          return {
            artist: 'Artist Two',
            album: 'Album One',
            title: 'Track 1',
            trackNumber: 1,
            genre: 'Pop'
          };
        } else if (basename.startsWith('artist1_album2')) {
          return {
            artist: 'Artist One',
            album: 'Album Two',
            title: 'Track 1',
            trackNumber: 1,
            genre: 'Jazz'
          };
        } else {
          // Return empty metadata for unknown tracks
          return {};
        }
      };
      
      // Now test extractMetadata
      const files = await this.fileOps.scanDirectory(this.sourceDir);
      const musicFiles = await this.metadataService.extractMetadata(files);
      
      logger.info(`Extracted metadata for ${musicFiles.length} files.`);
      
      if (musicFiles.length !== files.length) {
        throw new Error(`Expected metadata for ${files.length} files, but got ${musicFiles.length}.`);
      }
      
      // Verify metadata for a known file
      const artist1File = musicFiles.find(f => f.filename.startsWith('artist1_album1_track1'));
      if (!artist1File || artist1File.metadata.artist !== 'Artist One') {
        throw new Error('Metadata extraction failed for artist1 file.');
      }
      
      // Test handling of files with no metadata
      const unknownFile = musicFiles.find(f => f.filename.startsWith('unknown'));
      if (!unknownFile) {
        throw new Error('Unknown track not found in processed files.');
      }
      
      // Restore original method
      (this.metadataService as any).parseMetadata = originalParseMethod;
      
      logger.success('MetadataService tests passed!');
      return true;
    } catch (error) {
      logger.error(`MetadataService tests failed: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  /**
   * Test music sorter functionality
   */
  async testMusicSorter() {
    logger.info('Testing MusicSorter...');
    
    try {
      // Mock metadata similar to the previous test
      const files = await this.fileOps.scanDirectory(this.sourceDir);
      
      // We'll manually create MusicFile objects with metadata for testing
      const musicFiles = files.map(filePath => {
        const basename = path.basename(filePath);
        
        let metadata: any = {};
        
        // Create metadata based on filename
        if (basename.startsWith('artist1_album1')) {
          metadata = {
            artist: 'Artist One',
            album: 'Album One',
            title: basename.includes('track1') ? 'Track 1' : 'Track 2',
            trackNumber: basename.includes('track1') ? 1 : 2,
            genre: 'Rock'
          };
        } else if (basename.startsWith('artist2')) {
          metadata = {
            artist: 'Artist Two',
            album: 'Album One', 
            title: 'Track 1',
            trackNumber: 1,
            genre: 'Pop'
          };
        } else if (basename.startsWith('artist1_album2')) {
          metadata = {
            artist: 'Artist One',
            album: 'Album Two',
            title: 'Track 1',
            trackNumber: 1,
            genre: 'Jazz'
          };
        }
        
        return {
          path: filePath,
          filename: basename,
          extension: path.extname(filePath),
          size: 0, // Stub
          metadata
        };
      });
      
      // Test sorting by artist
      const artistSortOptions: SortOptions = {
        pattern: 'artist',
        copyMode: true,
        nestedStructure: true,
        includeArtistInAlbumFolder: true
      };
      
      // Add a progress callback for testing
      this.musicSorter.setProgressCallback((progress) => {
        logger.debug(`Sort progress: ${progress.processed}/${progress.total}`);
      });
      
      // Sort by artist
      await this.musicSorter.sortFiles(musicFiles, artistSortOptions);
      
      // Check if files were sorted correctly
      const artistOneDir = path.join(this.targetDir, 'by-artist', 'Artist One');
      const artistTwoDir = path.join(this.targetDir, 'by-artist', 'Artist Two');
      
      const artistOneDirExists = await this.fileExists(artistOneDir);
      const artistTwoDirExists = await this.fileExists(artistTwoDir);
      
      if (!artistOneDirExists || !artistTwoDirExists) {
        throw new Error('Artist directories not created correctly.');
      }
      
      // Test sorting by album
      const albumSortOptions: SortOptions = {
        pattern: 'album',
        copyMode: true,
        nestedStructure: true,
        includeArtistInAlbumFolder: true
      };
      
      // Clear target directory first
      await fs.rm(this.targetDir, { recursive: true, force: true });
      await fs.mkdir(this.targetDir, { recursive: true });
      
      // Sort by album
      await this.musicSorter.sortFiles(musicFiles, albumSortOptions);
      
      // Check if album structure was created
      const albumOneDir = path.join(this.targetDir, 'by-album', 'Artist One', 'Album One');
      const albumTwoDir = path.join(this.targetDir, 'by-album', 'Artist One', 'Album Two');
      
      const albumOneDirExists = await this.fileExists(albumOneDir);
      const albumTwoDirExists = await this.fileExists(albumTwoDir);
      
      if (!albumOneDirExists || !albumTwoDirExists) {
        throw new Error('Album directories not created correctly.');
      }
      
      // Test error handling
      try {
        await this.musicSorter.sortFiles(musicFiles, {
          pattern: 'invalid' as any,
          copyMode: true,
          nestedStructure: true,
          includeArtistInAlbumFolder: true
        });
        throw new Error('Expected error for invalid sort pattern, but none was thrown.');
      } catch (error) {
        if (!(error instanceof AppError) || error.category !== ErrorCategory.FILE_OPERATION) {
          throw new Error('Expected AppError with FILE_OPERATION category.');
        }
        logger.info('Successfully caught error for invalid sort pattern.');
      }
      
      logger.success('MusicSorter tests passed!');
      return true;
    } catch (error) {
      logger.error(`MusicSorter tests failed: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  /**
   * Test settings manager
   */
  async testSettingsManager() {
    logger.info('Testing SettingsManager...');
    
    try {
      // Initialize settings manager
      await settingsManager.initialize();
      
      // Get default settings
      const defaultSettings = await settingsManager.getAll();
      logger.info(`Default settings: ${JSON.stringify(defaultSettings)}`);
      
      // Update a setting
      const testSourcePath = '/test/source/path';
      await settingsManager.set('sourcePath', testSourcePath);
      
      // Verify setting was updated
      const updatedSourcePath = await settingsManager.get('sourcePath');
      if (updatedSourcePath !== testSourcePath) {
        throw new Error(`Setting not updated correctly. Expected ${testSourcePath}, got ${updatedSourcePath}.`);
      }
      
      // Test adding custom pattern
      const testPattern = '{artist}/{year}-{album}/{track}-{title}';
      await settingsManager.addCustomPattern('sort', testPattern);
      
      // Verify custom pattern was added
      const allSettings = await settingsManager.getAll();
      const customPatterns = allSettings.customPatterns.sort;
      
      if (!customPatterns.includes(testPattern)) {
        throw new Error('Custom pattern not added correctly.');
      }
      
      // Test removing custom pattern
      await settingsManager.removeCustomPattern('sort', testPattern);
      
      // Verify custom pattern was removed
      const updatedSettings = await settingsManager.getAll();
      const updatedCustomPatterns = updatedSettings.customPatterns.sort;
      
      if (updatedCustomPatterns.includes(testPattern)) {
        throw new Error('Custom pattern not removed correctly.');
      }
      
      // Reset settings to defaults
      await settingsManager.resetToDefaults();
      
      // Verify settings were reset
      const resetSettings = await settingsManager.getAll();
      if (resetSettings.sourcePath === testSourcePath) {
        throw new Error('Settings not reset correctly.');
      }
      
      logger.success('SettingsManager tests passed!');
      return true;
    } catch (error) {
      logger.error(`SettingsManager tests failed: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  /**
   * Test error handling
   */
  async testErrorHandling() {
    logger.info('Testing error handling...');
    
    try {
      // Test creating an AppError
      const testError = createAppError(
        ErrorCategory.FILE_OPERATION,
        'Test error message',
        new Error('Original error'),
        { testKey: 'testValue' }
      );
      
      if (!(testError instanceof AppError)) {
        throw new Error('createAppError did not return an AppError instance.');
      }
      
      if (testError.category !== ErrorCategory.FILE_OPERATION) {
        throw new Error(`Incorrect error category. Expected FILE_OPERATION, got ${testError.category}.`);
      }
      
      if (!testError.context || testError.context.testKey !== 'testValue') {
        throw new Error('Error context not set correctly.');
      }
      
      // Test throwing and catching an AppError
      try {
        throw testError;
      } catch (error) {
        if (!(error instanceof AppError)) {
          throw new Error('Caught error is not an AppError instance.');
        }
        
        logger.info('Successfully caught AppError.');
      }
      
      logger.success('Error handling tests passed!');
      return true;
    } catch (error) {
      logger.error(`Error handling tests failed: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  /**
   * Helper method to check if a path exists
   */
  private async fileExists(filePath: string): Promise<boolean> {
    // Use fs directly since we're just checking existence
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Run all tests
   */
  async runAllTests() {
    logger.info('Starting Music Sorter test suite...');
    
    // Set up test environment
    const setupSuccess = await this.setupTestEnvironment();
    if (!setupSuccess) {
      logger.error('Failed to set up test environment. Aborting tests.');
      return false;
    }
    
    try {
      // Run individual tests
      const fileOpsSuccess = await this.testFileOperations();
      const metadataSuccess = await this.testMetadataService();
      const sorterSuccess = await this.testMusicSorter();
      const settingsSuccess = await this.testSettingsManager();
      const errorHandlingSuccess = await this.testErrorHandling();
      
      // Summarize results
      logger.info('\n===== Test Results =====');
      logger.info(`FileOperations: ${fileOpsSuccess ? '✅ PASS' : '❌ FAIL'}`);
      logger.info(`MetadataService: ${metadataSuccess ? '✅ PASS' : '❌ FAIL'}`);
      logger.info(`MusicSorter: ${sorterSuccess ? '✅ PASS' : '❌ FAIL'}`);
      logger.info(`SettingsManager: ${settingsSuccess ? '✅ PASS' : '❌ FAIL'}`);
      logger.info(`Error Handling: ${errorHandlingSuccess ? '✅ PASS' : '❌ FAIL'}`);
      
      const allPassed = fileOpsSuccess && metadataSuccess && sorterSuccess && 
                       settingsSuccess && errorHandlingSuccess;
      
      logger.info(`\nOverall Result: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
      
      return allPassed;
    } finally {
      // Clean up test environment
      await this.cleanupTestEnvironment();
    }
  }
}

// Run the test suite
const testRunner = async () => {
  const testSuite = new MusicSorterTestSuite();
  const success = await testSuite.runAllTests();
  
  // Exit with appropriate code
  process.exit(success ? 0 : 1);
};

testRunner().catch(error => {
  logger.error(`Unhandled error in test runner: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
