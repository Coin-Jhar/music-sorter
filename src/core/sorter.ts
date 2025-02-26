// src/core/sorter.ts
import { MusicFile } from '../models/music-file';
import { FileOperations } from '../utils/file-operations';
import { SORT_PATTERNS } from '../config/constants';
import path from 'path';

export class MusicSorter {
  constructor(private fileOps: FileOperations) {}

  async sortByArtist(musicFiles: MusicFile[], copyMode = false): Promise<void> {
    console.log(`Sorting ${musicFiles.length} files by artist...`);
    
    for (const file of musicFiles) {
      const artist = file.metadata.artist || 'Unknown Artist';
      // Sanitize folder name to avoid special characters
      const sanitizedArtist = artist.replace(/[\/\\:*?"<>|]/g, '_');
      
      const relativePath = path.join(SORT_PATTERNS.ARTIST_FOLDER, sanitizedArtist, path.basename(file.path));
      
      if (copyMode) {
        await this.fileOps.copyFile(file.path, relativePath);
      } else {
        await this.fileOps.moveFile(file.path, relativePath);
      }
    }
  }

  async sortByAlbum(musicFiles: MusicFile[], copyMode = false): Promise<void> {
    console.log(`Sorting ${musicFiles.length} files by album...`);
    
    for (const file of musicFiles) {
      const artist = file.metadata.artist || 'Unknown Artist';
      const album = file.metadata.album || 'Unknown Album';
      // Sanitize folder names
      const sanitizedArtist = artist.replace(/[\/\\:*?"<>|]/g, '_');
      const sanitizedAlbum = album.replace(/[\/\\:*?"<>|]/g, '_');
      
      const relativePath = path.join(
        SORT_PATTERNS.ALBUM_FOLDER, 
        sanitizedArtist, 
        sanitizedAlbum, 
        path.basename(file.path)
      );
      
      if (copyMode) {
        await this.fileOps.copyFile(file.path, relativePath);
      } else {
        await this.fileOps.moveFile(file.path, relativePath);
      }
    }
  }

  async sortByGenre(musicFiles: MusicFile[], copyMode = false): Promise<void> {
    console.log(`Sorting ${musicFiles.length} files by genre...`);
    
    for (const file of musicFiles) {
      const genre = file.metadata.genre || 'Unknown Genre';
      const sanitizedGenre = genre.replace(/[\/\\:*?"<>|]/g, '_');
      
      const relativePath = path.join(
        SORT_PATTERNS.GENRE_FOLDER,
        sanitizedGenre,
        path.basename(file.path)
      );
      
      if (copyMode) {
        await this.fileOps.copyFile(file.path, relativePath);
      } else {
        await this.fileOps.moveFile(file.path, relativePath);
      }
    }
  }

  async sortByYear(musicFiles: MusicFile[], copyMode = false): Promise<void> {
    console.log(`Sorting ${musicFiles.length} files by year...`);
    
    for (const file of musicFiles) {
      const year = file.metadata.year ? file.metadata.year.toString() : 'Unknown Year';
      
      const relativePath = path.join(
        SORT_PATTERNS.YEAR_FOLDER,
        year,
        path.basename(file.path)
      );
      
      if (copyMode) {
        await this.fileOps.copyFile(file.path, relativePath);
      } else {
        await this.fileOps.moveFile(file.path, relativePath);
      }
    }
  }
}
