// src/server/server.ts
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs/promises';
import { MusicSorter } from '../core/sorter';
import { FileOperations } from '../utils/file-operations';
import { MetadataService } from '../services/metadata-service';
import { PATHS, SUPPORTED_EXTENSIONS } from '../config/constants';
import { logger } from '../utils/logger';

export async function startServer(port: number = 3000): Promise<void> {
  const app = express();
  
  // Middleware
  app.use(cors());
  app.use(express.json());
  
  // Serve static files
  const publicPath = path.join(__dirname, '../../public');
  logger.info(`Serving static files from: ${publicPath}`);
  app.use(express.static(publicPath));
  
  // Get configuration
  app.get('/api/config', function(req, res) {
    try {
      logger.info('Config requested');
      res.json({
        paths: PATHS,
        supportedExtensions: SUPPORTED_EXTENSIONS,
        sortPatterns: ['artist', 'album-artist', 'album', 'genre', 'year']
      });
    } catch (error) {
      logger.error('Error serving config:', error as Error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });
  
  // Scan directory
  app.get('/api/scan', function(req, res) {
    const fileOps = new FileOperations();
    const sourcePath = req.query.path as string || PATHS.SOURCE;
    
    logger.info(`Scanning directory: ${sourcePath}`);
    
    fileOps.scanDirectory(sourcePath)
      .then(files => {
        logger.info(`Found ${files.length} files`);
        res.json({ success: true, files });
      })
      .catch(error => {
        logger.error(`Error scanning directory ${sourcePath}:`, error as Error);
        res.status(500).json({ success: false, error: (error as Error).message });
      });
  });
  
  // Get file metadata
  app.get('/api/metadata', function(req, res) {
    const metadataService = new MetadataService();
    const fileOps = new FileOperations();
    
    const sourcePath = req.query.path as string || PATHS.SOURCE;
    
    logger.info(`Getting metadata from: ${sourcePath}`);
    
    fileOps.scanDirectory(sourcePath)
      .then(files => {
        logger.info(`Found ${files.length} files, extracting metadata`);
        return metadataService.extractMetadata(files);
      })
      .then(musicFiles => {
        logger.info(`Processed ${musicFiles.length} music files`);
        res.json({ success: true, musicFiles });
      })
      .catch(error => {
        logger.error(`Error getting metadata from ${sourcePath}:`, error as Error);
        res.status(500).json({ success: false, error: (error as Error).message });
      });
  });
  
  // Sort files
  app.post('/api/sort', function(req, res) {
    const { pattern, sourcePath, targetPath, copy } = req.body;
    
    logger.info(`Sorting request received: pattern=${pattern}, source=${sourcePath}, target=${targetPath}, copy=${copy}`);
    
    const fileOps = new FileOperations();
    const metadataService = new MetadataService();
    const musicSorter = new MusicSorter(fileOps);
    
    // Validate inputs
    if (!pattern) {
      return res.status(400).json({ success: false, error: 'Sort pattern is required' });
    }
    
    fileOps.scanDirectory(sourcePath || PATHS.SOURCE)
      .then(files => {
        logger.info(`Found ${files.length} files for sorting`);
        return metadataService.extractMetadata(files);
      })
      .then(async musicFiles => {
        logger.info(`Processing ${musicFiles.length} music files`);
        
        // Perform sorting based on pattern
        try {
          switch (pattern) {
            case 'artist':
              await musicSorter.sortByArtist(musicFiles, copy);
              break;
            case 'album-artist':
              await musicSorter.sortByAlbumArtist(musicFiles, copy);
              break;
            case 'album':
              await musicSorter.sortByAlbum(musicFiles, copy);
              break;
            case 'genre':
              await musicSorter.sortByGenre(musicFiles, copy);
              break;
            case 'year':
              await musicSorter.sortByYear(musicFiles, copy);
              break;
            default:
              throw new Error(`Unknown pattern: ${pattern}`);
          }
          
          logger.success('Sorting operation completed successfully');
          res.json({ success: true, message: 'Sorting complete' });
        } catch (err) {
          throw err;
        }
      })
      .catch(error => {
        logger.error('Error during sorting operation:', error as Error);
        res.status(500).json({ success: false, error: (error as Error).message });
      });
  });
  
  // Undo sorting
  app.post('/api/undo', function(req, res) {
    const fileOps = new FileOperations();
    const { sourcePath = PATHS.SOURCE, targetPath = PATHS.TARGET } = req.body;
    
    logger.info(`Undo sorting request: source=${sourcePath}, target=${targetPath}`);
    
    // Scan all files in sorted directory
    fileOps.scanDirectory(targetPath)
      .then(async (sortedFiles) => {
        logger.info(`Found ${sortedFiles.length} sorted files to restore`);
        
        // Make sure source directory exists
        await fileOps.ensureDirectoryExists(sourcePath);
        
        let successCount = 0;
        let errorCount = 0;
        
        // Move each file back to source
        for (const filePath of sortedFiles) {
          try {
            const fileName = path.basename(filePath);
            const targetFilePath = path.join(sourcePath, fileName);
            
            // Check if file with same name already exists at the destination
            try {
              await fs.access(targetFilePath);
              // If we get here, file exists - create a unique name
              const ext = path.extname(fileName);
              const baseName = path.basename(fileName, ext);
              const newFileName = `${baseName}_restored_${Date.now()}${ext}`;
              const newTargetPath = path.join(sourcePath, newFileName);
              
              await fs.rename(filePath, newTargetPath);
              logger.info(`Restored with new name: ${newFileName}`);
            } catch {
              // File doesn't exist at destination, proceed normally
              await fs.rename(filePath, targetFilePath);
              logger.info(`Restored: ${fileName}`);
            }
            
            successCount++;
          } catch (error) {
            logger.error(`Error restoring file ${filePath}:`, error as Error);
            errorCount++;
          }
        }
        
        logger.success(`Undo operation complete. Restored: ${successCount}, Failed: ${errorCount}`);
        res.json({ 
          success: true, 
          message: `Undo operation complete. Restored: ${successCount}, Failed: ${errorCount}`,
          details: { successCount, errorCount, totalFiles: sortedFiles.length }
        });
      })
      .catch(error => {
        logger.error('Error during undo operation:', error as Error);
        res.status(500).json({ success: false, error: (error as Error).message });
      });
  });
  
  // Fallback route - serve the main HTML file for any unmatched routes
  app.get('*', function(req, res) {
    res.sendFile(path.join(publicPath, 'index.html'));
  });
  
  // Start server
  return new Promise((resolve) => {
    const server = app.listen(port, () => {
      logger.success(`Server running at http://localhost:${port}`);
      resolve();
    });
    
    // Handle server errors
    server.on('error', (error) => {
      logger.error('Server error:', error as Error);
      if ((error as any).code === 'EADDRINUSE') {
        logger.error(`Port ${port} is already in use. Try a different port.`);
      }
    });
  });
}
