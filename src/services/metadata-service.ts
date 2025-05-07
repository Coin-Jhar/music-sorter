// src/services/metadata-service.ts
import { MusicFile, MusicMetadata } from '../models/music-file';
import path from 'path';
import fs from 'fs/promises';
import * as mm from 'music-metadata';
import { SUPPORTED_EXTENSIONS } from '../config/constants';
import { BaseService } from '../core/base-service';
import { ServiceOptions } from '../core/types';
import { AppError, ErrorCategory, createAppError } from '../utils/error-handler';
import { sanitizeFilename } from '../utils/string-utils';

interface ExtractMetadataOptions {
  skipCache?: boolean;
  processBatchSize?: number;
  allowIncompleteMetadata?: boolean;
  extractFromFilename?: boolean;
  progressCallback?: (progress: { total: number, processed: number }) => void;
}

export class MetadataService extends BaseService {
  private metadataCache: Map<string, MusicMetadata> = new Map();
  
  constructor(options: ServiceOptions = {}) {
    super(options);
  }

  /**
   * Extract metadata from multiple files with batch processing
   */
  async extractMetadata(
    filePaths: string[], 
    options: ExtractMetadataOptions = {}
  ): Promise<MusicFile[]> {
    const { 
      skipCache = false, 
      processBatchSize = 20,
      allowIncompleteMetadata = true,
      extractFromFilename = true,
      progressCallback
    } = options;
    
    this.log(`Extracting metadata from ${filePaths.length} files...`);
    const musicFiles: MusicFile[] = [];
    const batches: string[][] = [];
    
    // Create batches of files for processing
    for (let i = 0; i < filePaths.length; i += processBatchSize) {
      batches.push(filePaths.slice(i, i + processBatchSize));
    }
    
    let processedCount = 0;
    let errorCount = 0;
    
    // Process each batch
    for (const batch of batches) {
      const batchResults = await Promise.allSettled(
        batch.map(filePath => this.processFile(filePath, { 
          skipCache, 
          allowIncompleteMetadata,
          extractFromFilename
        }))
      );
      
      // Collect results from each batch
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          musicFiles.push(result.value);
          processedCount++;
        } else if (result.status === 'rejected') {
          errorCount++;
          this.error(`Error processing file ${batch[index]}:`, 
            result.reason instanceof Error ? result.reason : new Error(String(result.reason))
          );
        }
      });
      
      // Log progress
      this.log(`Processed ${processedCount}/${filePaths.length} files (${errorCount} errors)...`);
      
      // Report progress if callback is provided
      if (progressCallback) {
        progressCallback({
          total: filePaths.length,
          processed: processedCount
        });
      }
    }
    
    return musicFiles;
  }
  
  /**
   * Process a single file
   */
  private async processFile(
    filePath: string, 
    options: { 
      skipCache: boolean, 
      allowIncompleteMetadata: boolean,
      extractFromFilename: boolean
    }
  ): Promise<MusicFile | null> {
    try {
      const stats = await fs.stat(filePath);
      
      if (!stats.isFile()) return null;
      
      const extension = path.extname(filePath).toLowerCase();
      if (!SUPPORTED_EXTENSIONS.includes(extension)) return null;
      
      let metadata: MusicMetadata;
      
      // Use cached metadata if available and not skipping cache
      const cacheKey = `${filePath}-${stats.mtime.getTime()}`;
      if (!options.skipCache && this.metadataCache.has(cacheKey)) {
        this.log(`Using cached metadata for ${path.basename(filePath)}`);
        metadata = this.metadataCache.get(cacheKey)!;
      } else {
        try {
          metadata = await this.parseMetadata(filePath);
        } catch (error) {
          // If parsing fails and we allow incomplete metadata, try to extract from filename
          if (options.allowIncompleteMetadata) {
            this.warn(`Failed to parse metadata from ${filePath}, extracting from filename...`);
            metadata = options.extractFromFilename ? 
              this.extractMetadataFromFilename(filePath) : 
              {};
          } else {
            throw error;
          }
        }
        
        // Cache the result
        this.metadataCache.set(cacheKey, metadata);
      }
      
      return {
        path: filePath,
        filename: path.basename(filePath),
        extension,
        size: stats.size,
        metadata,
        lastModified: stats.mtime
      };
    } catch (error) {
      throw createAppError(
        ErrorCategory.METADATA_EXTRACTION,
        `Failed to process file: ${filePath}`,
        error as Error,
        { path: filePath }
      );
    }
  }
  
  /**
   * Parse metadata from a music file
   */
  private async parseMetadata(filePath: string): Promise<MusicMetadata> {
    try {
      const metadata = await mm.parseFile(filePath);
      
      // Normalized result with fallbacks for each field
      return {
        title: this.sanitizeMetadataField(metadata.common.title),
        artist: this.sanitizeMetadataField(metadata.common.artist),
        albumArtist: this.sanitizeMetadataField(metadata.common.albumartist),
        album: this.sanitizeMetadataField(metadata.common.album),
        year: metadata.common.year,
        genre: this.sanitizeMetadataField(metadata.common.genre?.[0]),
        trackNumber: metadata.common.track.no ?? undefined,
        discNumber: metadata.common.disk.no ?? undefined,
        duration: metadata.format.duration,
        bitrate: metadata.format.bitrate,
        sampleRate: metadata.format.sampleRate,
        channels: metadata.format.numberOfChannels,
        // Extract any available cover art
        hasCoverArt: metadata.common.picture && metadata.common.picture.length > 0
      };
    } catch (error) {
      // Handle empty or very small files
      if ((error as Error).message?.includes('out of range') || 
          (error as Error).message?.includes('too small')) {
        this.warn(`File ${filePath} is empty or too small for metadata parsing`);
        return this.extractMetadataFromFilename(filePath);
      }
      
      this.error(`Error extracting metadata from ${filePath}:`, error as Error);
      
      // Parse filename to try to extract some basic info
      return this.extractMetadataFromFilename(filePath);
    }
  }
  
  /**
   * Sanitize a metadata field, handling null, undefined, and empty values
   */
  private sanitizeMetadataField(value: string | null | undefined): string | undefined {
    if (value === null || value === undefined || value.trim() === '') {
      return undefined;
    }
    return value.trim();
  }
  
  /**
   * Extract basic metadata from filename as fallback
   */
  private extractMetadataFromFilename(filePath: string): MusicMetadata {
    const filename = path.basename(filePath, path.extname(filePath));
    
    // Try to match common patterns like "Artist - Title" or "Artist - Album - Title"
    const patterns = [
      // Artist - Title
      /^(.*?)\s*-\s*(.*?)$/,
      // Artist - Album - Title
      /^(.*?)\s*-\s*(.*?)\s*-\s*(.*?)$/,
      // Track - Artist - Title
      /^(\d+)\s*-\s*(.*?)\s*-\s*(.*?)$/,
      // Artist_Album_Track
      /^(.+?)_(.+?)_(?:track)?(\d+)$/i,
      // Year - Artist - Title
      /^(\d{4})\s*-\s*(.*?)\s*-\s*(.*?)$/
    ];
    
    for (const pattern of patterns) {
      const match = filename.match(pattern);
      if (match) {
        if (match.length === 3) {
          // Artist - Title pattern
          return {
            artist: match[1].trim(),
            title: match[2].trim()
          };
        } else if (match.length === 4) {
          if (/^\d+$/.test(match[1])) {
            if (match[1].length === 4) {
              // Year - Artist - Title pattern
              return {
                year: parseInt(match[1], 10),
                artist: match[2].trim(),
                title: match[3].trim()
              };
            } else {
              // Track - Artist - Title pattern
              return {
                trackNumber: parseInt(match[1], 10),
                artist: match[2].trim(),
                title: match[3].trim()
              };
            }
          } else {
            // Artist - Album - Title pattern
            return {
              artist: match[1].trim(),
              album: match[2].trim(),
              title: match[3].trim()
            };
          }
        }
      }
    }
    
    // No pattern matched, just use filename as title
    return {
      title: filename
    };
  }
  
  /**
   * Clear the metadata cache
   */
  clearCache(): void {
    this.log('Clearing metadata cache');
    this.metadataCache.clear();
  }
  
  /**
   * Mock metadata for testing purposes
   * This is useful for testing with empty files
   */
  mockMetadataForFile(file: MusicFile, metadata: MusicMetadata): MusicFile {
    const updatedFile = { ...file, metadata: { ...metadata } };
    
    // Update cache
    const cacheKey = `${file.path}-${file.lastModified?.getTime() || Date.now()}`;
    this.metadataCache.set(cacheKey, metadata);
    
    return updatedFile;
  }
  
  /**
   * Mock metadata for multiple files (useful for testing)
   */
  mockMetadataForFiles(files: MusicFile[], metadataGenerator: (file: MusicFile) => MusicMetadata): MusicFile[] {
    return files.map(file => this.mockMetadataForFile(file, metadataGenerator(file)));
  }
}