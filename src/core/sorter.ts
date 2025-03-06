// src/core/sorter.ts
import { MusicFile, MusicMetadata, SortPattern, SortOptions } from '../models/music-file';
import { FileOperations } from '../utils/file-operations';
import { SORT_PATTERNS } from '../config/constants';
import path from 'path';
import { BaseService } from './base-service';
import { ServiceOptions } from './types';
import { formatTemplate, sanitizeFilename } from '../utils/string-utils';
import { AppError, ErrorCategory, createAppError } from '../utils/error-handler';

export interface SortProgressCallback {
  (progress: {
    total: number;
    processed: number;
    succeeded: number;
    failed: number;
  }): void;
}

export class MusicSorter extends BaseService {
  private fileOps: FileOperations;
  private sortProgress: {
    total: number;
    processed: number;
    succeeded: number;
    failed: number;
  };
  private progressCallback?: SortProgressCallback;

  constructor(fileOps: FileOperations, options: ServiceOptions = {}) {
    super(options);
    this.fileOps = fileOps;
    this.sortProgress = {
      total: 0,
      processed: 0,
      succeeded: 0,
      failed: 0
    };
  }

  /**
   * Set progress callback function
   */
  setProgressCallback(callback: SortProgressCallback): void {
    this.progressCallback = callback;
  }

  /**
   * Reset progress counters
   */
  resetProgress(): void {
    this.sortProgress = {
      total: 0,
      processed: 0,
      succeeded: 0,
      failed: 0
    };
  }

  /**
   * Update progress and notify callback if set
   */
  private updateProgress(succeeded: boolean): void {
    this.sortProgress.processed++;
    if (succeeded) {
      this.sortProgress.succeeded++;
    } else {
      this.sortProgress.failed++;
    }

    if (this.progressCallback) {
      this.progressCallback({ ...this.sortProgress });
    }
  }

  /**
   * Sort music files according to specified pattern
   */
  async sortFiles(musicFiles: MusicFile[], options: SortOptions): Promise<void> {
    this.log(`Sorting ${musicFiles.length} files with pattern: ${options.pattern}...`);
    
    // Reset progress and set total
    this.resetProgress();
    this.sortProgress.total = musicFiles.length;
    
    // Choose sorting method based on pattern
    switch (options.pattern) {
      case 'artist':
        await this.sortByArtist(musicFiles, options.copyMode);
        break;
      case 'album-artist':
        await this.sortByAlbumArtist(musicFiles, options.copyMode);
        break;
      case 'album':
        await this.sortByAlbum(musicFiles, options.copyMode);
        break;
      case 'genre':
        await this.sortByGenre(musicFiles, options.copyMode);
        break;
      case 'year':
        await this.sortByYear(musicFiles, options.copyMode);
        break;
      case 'custom':
        if (!options.template) {
          throw createAppError(
            ErrorCategory.FILE_OPERATION,
            'Custom pattern requires a template',
            undefined,
            { pattern: options.pattern }
          );
        }
        await this.sortByCustomPattern(musicFiles, options.template, options.copyMode);
        break;
      default:
        throw createAppError(
          ErrorCategory.FILE_OPERATION,
          `Unknown sort pattern: ${options.pattern}`,
          undefined,
          { pattern: options.pattern }
        );
    }
    
    // Wait for all queued operations to complete
    await this.fileOps.flushQueue();
  }

  /**
   * Sort by artist
   */
  async sortByArtist(musicFiles: MusicFile[], copyMode = false): Promise<void> {
    this.log(`Sorting ${musicFiles.length} files by artist...`);
    
    for (const file of musicFiles) {
      try {
        const artist = file.metadata.artist || 'Unknown Artist';
        // Sanitize folder name to avoid special characters
        const sanitizedArtist = sanitizeFilename(artist);
        
        const relativePath = path.join(SORT_PATTERNS.ARTIST_FOLDER, sanitizedArtist, path.basename(file.path));
        
        await this.processFile(file, relativePath, copyMode);
        this.updateProgress(true);
      } catch (error) {
        this.error(`Error sorting file ${file.path}:`, error as Error);
        this.updateProgress(false);
      }
    }
  }

  /**
   * Sort by album artist
   */
  async sortByAlbumArtist(musicFiles: MusicFile[], copyMode = false): Promise<void> {
    this.log(`Sorting ${musicFiles.length} files by album artist...`);
    
    for (const file of musicFiles) {
      try {
        // Use albumArtist if available, fall back to artist if not
        let albumArtist = file.metadata.albumArtist;
        if (!albumArtist) {
          albumArtist = file.metadata.artist || 'Unknown Artist';
        }
        
        const album = file.metadata.album || 'Unknown Album';
        
        // Sanitize folder names
        const sanitizedArtist = sanitizeFilename(albumArtist);
        const sanitizedAlbum = sanitizeFilename(album);
        
        const relativePath = path.join(
          SORT_PATTERNS.ALBUM_ARTIST_FOLDER, 
          sanitizedArtist, 
          sanitizedAlbum, 
          path.basename(file.path)
        );
        
        await this.processFile(file, relativePath, copyMode);
        this.updateProgress(true);
      } catch (error) {
        this.error(`Error sorting file ${file.path}:`, error as Error);
        this.updateProgress(false);
      }
    }
  }

  /**
   * Sort by album
   */
  async sortByAlbum(musicFiles: MusicFile[], copyMode = false): Promise<void> {
    this.log(`Sorting ${musicFiles.length} files by album...`);
    
    for (const file of musicFiles) {
      try {
        const artist = file.metadata.artist || 'Unknown Artist';
        const album = file.metadata.album || 'Unknown Album';
        
        // Sanitize folder names
        const sanitizedArtist = sanitizeFilename(artist);
        const sanitizedAlbum = sanitizeFilename(album);
        
        const relativePath = path.join(
          SORT_PATTERNS.ALBUM_FOLDER, 
          sanitizedArtist, 
          sanitizedAlbum, 
          path.basename(file.path)
        );
        
        await this.processFile(file, relativePath, copyMode);
        this.updateProgress(true);
      } catch (error) {
        this.error(`Error sorting file ${file.path}:`, error as Error);
        this.updateProgress(false);
      }
    }
  }

  /**
   * Sort by genre
   */
  async sortByGenre(musicFiles: MusicFile[], copyMode = false): Promise<void> {
    this.log(`Sorting ${musicFiles.length} files by genre...`);
    
    for (const file of musicFiles) {
      try {
        const genre = file.metadata.genre || 'Unknown Genre';
        const sanitizedGenre = sanitizeFilename(genre);
        
        const relativePath = path.join(
          SORT_PATTERNS.GENRE_FOLDER,
          sanitizedGenre,
          path.basename(file.path)
        );
        
        await this.processFile(file, relativePath, copyMode);
        this.updateProgress(true);
      } catch (error) {
        this.error(`Error sorting file ${file.path}:`, error as Error);
        this.updateProgress(false);
      }
    }
  }

  /**
   * Sort by year
   */
  async sortByYear(musicFiles: MusicFile[], copyMode = false): Promise<void> {
    this.log(`Sorting ${musicFiles.length} files by year...`);
    
    for (const file of musicFiles) {
      try {
        const year = file.metadata.year ? file.metadata.year.toString() : 'Unknown Year';
        
        const relativePath = path.join(
          SORT_PATTERNS.YEAR_FOLDER,
          year,
          path.basename(file.path)
        );
        
        await this.processFile(file, relativePath, copyMode);
        this.updateProgress(true);
      } catch (error) {
        this.error(`Error sorting file ${file.path}:`, error as Error);
        this.updateProgress(false);
      }
    }
  }

  /**
   * Sort by custom pattern using template
   */
  async sortByCustomPattern(musicFiles: MusicFile[], template: string, copyMode = false): Promise<void> {
    this.log(`Sorting ${musicFiles.length} files by custom pattern: ${template}...`);
    
    for (const file of musicFiles) {
      try {
        const values = this.extractTemplateValues(file);
        const relativePath = formatTemplate(template, values);
        const sanitizedPath = this.sanitizeTemplatePath(relativePath);
        
        // Add filename to the path
        const fullPath = path.join(
          'custom',
          sanitizedPath,
          path.basename(file.path)
        );
        
        await this.processFile(file, fullPath, copyMode);
        this.updateProgress(true);
      } catch (error) {
        this.error(`Error sorting file ${file.path}:`, error as Error);
        this.updateProgress(false);
      }
    }
  }

  /**
   * Extract template values from a music file's metadata
   */
  private extractTemplateValues(file: MusicFile): Record<string, string | number | undefined> {
    const { metadata } = file;
    return {
      artist: metadata.artist || 'Unknown Artist',
      albumArtist: metadata.albumArtist || metadata.artist || 'Unknown Artist',
      album: metadata.album || 'Unknown Album',
      title: metadata.title || path.basename(file.filename, file.extension),
      genre: metadata.genre || 'Unknown Genre',
      year: metadata.year?.toString() || 'Unknown Year',
      track: metadata.trackNumber?.toString().padStart(2, '0') || '00',
      disc: metadata.discNumber?.toString() || '1',
      ext: file.extension.slice(1), // Remove the leading dot
      filename: path.basename(file.filename, file.extension)
    };
  }

  /**
   * Sanitize a template path to ensure it's valid
   */
  private sanitizeTemplatePath(templatePath: string): string {
    // Split path into segments and sanitize each one
    return templatePath.split(path.sep)
      .map(segment => sanitizeFilename(segment))
      .join(path.sep);
  }

  /**
   * Process a single file (move or copy)
   */
  private async processFile(file: MusicFile, relativePath: string, copyMode: boolean): Promise<void> {
    if (copyMode) {
      await this.fileOps.queueOperation(() => this.fileOps.copyFile(file.path, relativePath));
    } else {
      await this.fileOps.queueOperation(() => this.fileOps.moveFile(file.path, relativePath));
    }
  }
}
