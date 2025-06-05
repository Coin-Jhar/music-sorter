// src/server/server.ts
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs/promises';
import { MusicSorter } from '../core/sorter';
import { FileOperations } from '../utils/file-operations';
import { MetadataService } from '../services/metadata-service';
import { PATHS, SUPPORTED_EXTENSIONS } from '../config/constants';
import { SortOptions, SortPattern } from '../models/music-file';
import { logger } from '../utils/logger';
import { settingsManager } from '../config/settings-manager';

export async function startServer(port: number = 3000): Promise<void> {
  const app = express();
  
  // Middleware
  app.use(cors());
  app.use(express.json());
  
  // Serve static files
  const publicPath = path.join(__dirname, '../../public');
  logger.info(`Serving static files from: ${publicPath}`);
  app.use(express.static(publicPath));
  
  // Initialize settings at server start
  await settingsManager.initialize();
  
  // Get configuration
  app.get('/api/config', async function(req, res) {
    try {
      logger.info('Config requested');
      // Get current settings
      const settings = await settingsManager.getAll();
      
      res.json({
        paths: {
          SOURCE: settings.sourcePath,
          TARGET: settings.targetPath
        },
        supportedExtensions: SUPPORTED_EXTENSIONS,
        sortPatterns: ['artist', 'album-artist', 'album', 'genre', 'year'],
        settings: settings
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
  app.post('/api/sort', async function(req, res) {
    try {
      const { pattern, sourcePath, targetPath, copy } = req.body;
      
      logger.info(`Sorting request received: pattern=${pattern}, source=${sourcePath}, target=${targetPath}, copy=${copy}`);
      
      // Get current settings
      const settings = await settingsManager.getAll();
      
      const fileOps = new FileOperations();
      const metadataService = new MetadataService();
      const musicSorter = new MusicSorter(fileOps);
      
      // Validate inputs
      if (!pattern) {
        return res.status(400).json({ success: false, error: 'Sort pattern is required' });
      }
      
      // Source path: use provided value, or fall back to settings, then PATHS constant
      const sourceDir = sourcePath || settings.sourcePath || PATHS.SOURCE;
      // Target path: use provided value, or fall back to settings, then PATHS constant
      const targetDir = targetPath || settings.targetPath || PATHS.TARGET;
      
      // Update settings with new values if they differ from current settings
      if (sourceDir !== settings.sourcePath) {
        await settingsManager.set('sourcePath', sourceDir);
      }
      
      if (targetDir !== settings.targetPath) {
        await settingsManager.set('targetPath', targetDir);
      }
      
      // Track the last used pattern
      await settingsManager.set('lastUsedPattern', pattern);
      
      const files = await fileOps.scanDirectory(sourceDir);
      logger.info(`Found ${files.length} files for sorting`);
      
      const musicFiles = await metadataService.extractMetadata(files);
      logger.info(`Processing ${musicFiles.length} music files`);

      const sortOptions: SortOptions = {
        pattern: pattern as SortPattern,
        copyMode: !!copy,
        nestedStructure: true,
        includeArtistInAlbumFolder: true
      };

      await musicSorter.sortFiles(musicFiles, sortOptions);

      logger.success('Sorting operation completed successfully');
      res.json({ success: true, message: 'Sorting complete' });
    } catch (error) {
      logger.error('Error during sorting operation:', error as Error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });
  
  // Undo sorting
  app.post('/api/undo', async function(req, res) {
    try {
      const fileOps = new FileOperations();
      const settings = await settingsManager.getAll();
      
      const { sourcePath = settings.sourcePath, targetPath = settings.targetPath } = req.body;
      
      logger.info(`Undo sorting request: source=${sourcePath}, target=${targetPath}`);
      
      // Scan all files in sorted directory
      const sortedFiles = await fileOps.scanDirectory(targetPath);
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
    } catch (error) {
      logger.error('Error during undo operation:', error as Error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  // Get settings
  app.get('/api/settings', async function(req, res) {
    try {
      const settings = await settingsManager.getAll();
      res.json({ success: true, settings });
    } catch (error) {
      logger.error('Error getting settings:', error as Error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });
  
  // Update settings
  app.post('/api/settings', async function(req, res) {
    try {
      const updatedSettings = req.body;
      await settingsManager.updateSettings(updatedSettings);
      res.json({ success: true, message: 'Settings updated successfully' });
    } catch (error) {
      logger.error('Error updating settings:', error as Error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });
  
  // Reset settings
  app.post('/api/settings/reset', async function(req, res) {
    try {
      await settingsManager.resetToDefaults();
      res.json({ success: true, message: 'Settings reset to defaults' });
    } catch (error) {
      logger.error('Error resetting settings:', error as Error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });
  
  // Add custom pattern
  app.post('/api/settings/patterns/:type', async function(req, res) {
    try {
      const { type } = req.params;
      const { pattern } = req.body;
      
      if (type !== 'rename' && type !== 'sort') {
        return res.status(400).json({ success: false, error: 'Type must be either "rename" or "sort"' });
      }
      
      if (!pattern) {
        return res.status(400).json({ success: false, error: 'Pattern is required' });
      }
      
      await settingsManager.addCustomPattern(type as 'rename' | 'sort', pattern);
      res.json({ success: true, message: `Added custom ${type} pattern` });
    } catch (error) {
      logger.error('Error adding custom pattern:', error as Error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });
  
  // Remove custom pattern
  app.delete('/api/settings/patterns/:type', async function(req, res) {
    try {
      const { type } = req.params;
      const { pattern } = req.body;
      
      if (type !== 'rename' && type !== 'sort') {
        return res.status(400).json({ success: false, error: 'Type must be either "rename" or "sort"' });
      }
      
      if (!pattern) {
        return res.status(400).json({ success: false, error: 'Pattern is required' });
      }
      
      await settingsManager.removeCustomPattern(type as 'rename' | 'sort', pattern);
      res.json({ success: true, message: `Removed custom ${type} pattern` });
    } catch (error) {
      logger.error('Error removing custom pattern:', error as Error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
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
