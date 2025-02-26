// src/services/metadata-service.ts
import { MusicFile, MusicMetadata } from '../models/music-file';
import path from 'path';
import fs from 'fs/promises';
import * as mm from 'music-metadata';
import { SUPPORTED_EXTENSIONS } from '../config/constants';
import { BaseService } from '../core/base-service';
import { ServiceOptions } from '../core/types';

export class MetadataService extends BaseService {
  constructor(options: ServiceOptions = {}) {
    super(options);
  }

  async extractMetadata(filePaths: string[]): Promise<MusicFile[]> {
    this.log(`Extracting metadata from ${filePaths.length} files...`);
    const musicFiles: MusicFile[] = [];
    
    for (const filePath of filePaths) {
      try {
        const stats = await fs.stat(filePath);
        
        if (!stats.isFile()) continue;
        
        const extension = path.extname(filePath).toLowerCase();
        if (!SUPPORTED_EXTENSIONS.includes(extension)) continue;
        
        const metadata = await this.parseMetadata(filePath);
        
        musicFiles.push({
          path: filePath,
          filename: path.basename(filePath),
          extension,
          size: stats.size,
          metadata
        });
      } catch (error) {
        this.error(`Error processing ${filePath}:`, error as Error);
      }
    }
    
    return musicFiles;
  }
  
  private async parseMetadata(filePath: string): Promise<MusicMetadata> {
    try {
      const metadata = await mm.parseFile(filePath);
    
      return {
        title: metadata.common.title,
        artist: metadata.common.artist,
        albumArtist: metadata.common.albumartist || metadata.common.artist,
        album: metadata.common.album,
        year: metadata.common.year,
        genre: metadata.common.genre?.[0],
        trackNumber: metadata.common.track.no ?? undefined // Convert null to undefined
      };
    } catch (error) {
      this.error(`Error extracting metadata from ${filePath}:`, error as Error);
      return {};
    }
  }
}
