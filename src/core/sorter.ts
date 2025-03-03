// src/core/sorter.ts
import { MusicFile } from '../models/music-file';
import { FileOperations } from '../utils/file-operations';
import { SORT_PATTERNS } from '../config/constants';
import path from 'path';
import { BaseService } from './base-service';
import { ServiceOptions } from './types';

export class MusicSorter extends BaseService {
  constructor(private fileOps: FileOperations, options: ServiceOptions = {}) {
    super(options);
  }

  async sortByArtist(musicFiles: MusicFile[], copyMode = false): Promise<void> {
    this.log(`Sorting ${musicFiles.length} files by artist...`);
    
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

  async sortByAlbumArtist(musicFiles: MusicFile[], copyMode = false): Promise<void> {
    this.log(`Sorting ${musicFiles.length} files by album artist...`);
    
    for (const file of musicFiles) {
      // Debug the actual metadata being used for decisions
      console.log(`SORTING "${file.filename}":`);
      console.log(`- Raw albumArtist from metadata: ${file.metadata.albumArtist === undefined ? 'undefined' : (file.metadata.albumArtist === null ? 'null' : `"${file.metadata.albumArtist}"`)}`);
      console.log(`- Raw artist from metadata: ${file.metadata.artist === undefined ? 'undefined' : (file.metadata.artist === null ? 'null' : `"${file.metadata.artist}"`)}`);
      
      // STRICT APPROACH: Use albumArtist field, explicitly falling back to Unknown if not present
      // Don't use artist as fallback
      let folderName: string;
      if (file.metadata.albumArtist === undefined || file.metadata.albumArtist === null || file.metadata.albumArtist === '') {
        folderName = 'Unknown Album Artist';
        console.log(`- Using folder: "${folderName}" (no album artist found)`);
      } else {
        folderName = file.metadata.albumArtist;
        console.log(`- Using folder: "${folderName}" (from album artist)`);
      }
      
      const album = file.metadata.album || 'Unknown Album';
      
      // Sanitize folder names
      const sanitizedFolderName = folderName.replace(/[\/\\:*?"<>|]/g, '_');
      const sanitizedAlbum = album.replace(/[\/\\:*?"<>|]/g, '_');
      
      const relativePath = path.join(
        SORT_PATTERNS.ALBUM_ARTIST_FOLDER, 
        sanitizedFolderName, 
        sanitizedAlbum, 
        path.basename(file.path)
      );
      
      console.log(`- Final path: ${relativePath}`);
      
      if (copyMode) {
        await this.fileOps.copyFile(file.path, relativePath);
      } else {
        await this.fileOps.moveFile(file.path, relativePath);
      }
    }
  }

  async sortByAlbum(musicFiles: MusicFile[], copyMode = false): Promise<void> {
    this.log(`Sorting ${musicFiles.length} files by album...`);
    
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
    this.log(`Sorting ${musicFiles.length} files by genre...`);
    
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
    this.log(`Sorting ${musicFiles.length} files by year...`);
    
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
