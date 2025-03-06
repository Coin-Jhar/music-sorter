// src/tests/generate-test-data.ts
import fs from 'fs/promises';
import path from 'path';
import { logger } from '../utils/logger';

/**
 * Helper script to generate test data for the music sorter
 * This creates empty MP3 files with metadata in filenames
 */
async function generateTestData() {
  // Configure test directories
  const testDir = path.join(process.cwd(), 'test-data');
  const sourceDir = path.join(testDir, 'source');
  
  logger.info('Generating test data...');
  
  try {
    // Clean up previous test directory if it exists
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore if directory doesn't exist
    }
    
    // Create test directory
    await fs.mkdir(sourceDir, { recursive: true });
    
    // Generate test files
    const testFiles = [
      // Artist 1, Album 1
      { name: 'artist1_album1_track1.mp3', artist: 'Artist One', album: 'Album One', track: 1 },
      { name: 'artist1_album1_track2.mp3', artist: 'Artist One', album: 'Album One', track: 2 },
      
      // Artist 2, Album 1
      { name: 'artist2_album1_track1.mp3', artist: 'Artist Two', album: 'Album One', track: 1 },
      
      // Artist 1, Album 2
      { name: 'artist1_album2_track1.mp3', artist: 'Artist One', album: 'Album Two', track: 1 },
      
      // Unknown track
      { name: 'unknown_track.mp3', artist: '', album: '', track: 0 }
    ];
    
    // Create empty files
    for (const file of testFiles) {
      const filePath = path.join(sourceDir, file.name);
      await fs.writeFile(filePath, '');
      logger.info(`Created test file: ${file.name}`);
    }
    
    // Create a README file in the test directory
    const readmePath = path.join(testDir, 'README.md');
    const readmeContent = `# Test Data for Music Sorter

This directory contains test data for the Music Sorter application.

## Files Structure

- \`source/\` - Source directory with test files
  - Empty MP3 files with metadata encoded in filenames
  - Format: artist_album_track.mp3

## Usage

Use these files with the test suite or for manual testing.

## Cleanup

You can safely delete this directory after testing.
`;
    
    await fs.writeFile(readmePath, readmeContent);
    
    logger.success(`Test data generated successfully in ${testDir}`);
    logger.info(`Generated ${testFiles.length} test files.`);
    
    return testDir;
  } catch (error) {
    logger.error(`Failed to generate test data: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

// Run the generator if this script is executed directly
if (require.main === module) {
  generateTestData()
    .then(testDir => {
      console.log(`Test data generated in: ${testDir}`);
    })
    .catch(error => {
      console.error('Error generating test data:', error);
      process.exit(1);
    });
}

export { generateTestData };
