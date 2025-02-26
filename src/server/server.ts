// src/server/server.ts
import express from 'express';
import cors from 'cors';
import path from 'path';
import { MusicSorter } from '../core/sorter';
import { FileOperations } from '../utils/file-operations';
import { MetadataService } from '../services/metadata-service';
import { PATHS, SUPPORTED_EXTENSIONS } from '../config/constants';

export async function startServer(port: number = 3000): Promise<void> {
  const app = express();
  
  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.static(path.join(__dirname, '../../public')));
  
  // API Routes
  
  // Get configuration
  app.get('/api/config', function(req, res) {
    res.json({
      paths: PATHS,
      supportedExtensions: SUPPORTED_EXTENSIONS,
      sortPatterns: ['artist', 'album-artist', 'album', 'genre', 'year']
    });
  });
  
  // Scan directory
  app.get('/api/scan', function(req, res) {
    const fileOps = new FileOperations();
    const sourcePath = req.query.path as string || PATHS.SOURCE;
    
    fileOps.scanDirectory(sourcePath)
      .then(files => {
        res.json({ success: true, files });
      })
      .catch(error => {
        res.status(500).json({ success: false, error: (error as Error).message });
      });
  });
  
  // Get file metadata
  app.get('/api/metadata', function(req, res) {
    const metadataService = new MetadataService();
    const fileOps = new FileOperations();
    
    const sourcePath = req.query.path as string || PATHS.SOURCE;
    
    fileOps.scanDirectory(sourcePath)
      .then(files => metadataService.extractMetadata(files))
      .then(musicFiles => {
        res.json({ success: true, musicFiles });
      })
      .catch(error => {
        res.status(500).json({ success: false, error: (error as Error).message });
      });
  });
  
  // Sort files
  app.post('/api/sort', function(req, res) {
    const { pattern, sourcePath, targetPath, copy } = req.body;
    
    const fileOps = new FileOperations();
    const metadataService = new MetadataService();
    const musicSorter = new MusicSorter(fileOps);
    
    fileOps.scanDirectory(sourcePath || PATHS.SOURCE)
      .then(files => metadataService.extractMetadata(files))
      .then(async musicFiles => {
        // Perform sorting based on pattern
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
        
        res.json({ success: true, message: 'Sorting complete' });
      })
      .catch(error => {
        res.status(500).json({ success: false, error: (error as Error).message });
      });
  });
  
  // Undo sorting
  app.post('/api/undo', function(req, res) {
    const fileOps = new FileOperations();
    const { sourcePath, targetPath } = req.body;
    
    // Implementation of undo logic
    // This would move files from target back to source
    
    res.json({ success: true, message: 'Undo complete' });
  });
  
  // Start server
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}
