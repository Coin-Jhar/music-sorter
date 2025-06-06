// src/models/music-file.ts
export interface MusicMetadata {
  title?: string;
  artist?: string;
  albumArtist?: string;
  album?: string;
  year?: number;
  genre?: string;
  trackNumber?: number;
  discNumber?: number;
  duration?: number;
  bitrate?: number;
  sampleRate?: number;
  channels?: number;
  hasCoverArt?: boolean;
  composer?: string;
  lyrics?: string;
  comment?: string;
  isrc?: string; // International Standard Recording Code
  bpm?: number; // Beats per minute
  key?: string; // Musical key
  encodingTool?: string;
  encodingDate?: string;
  releaseCountry?: string;
  language?: string;
  compilation?: boolean; // Is part of a compilation
  rating?: number; // User rating
  replayGain?: number; // Replay gain adjustment
}

export interface MusicFile {
  path: string;
  filename: string;
  extension: string;
  size: number;
  metadata: MusicMetadata;
  lastModified?: Date;
  created?: Date;
  hash?: string; // For detecting duplicates
  sortKey?: string; // Computed field for sorting
}

export interface MusicCollection {
  files: MusicFile[];
  stats: {
    totalSize: number;
    totalCount: number;
    artistCount: number;
    albumCount: number;
    genreCount: number;
    formatCounts: Record<string, number>;
    yearRange?: {
      min: number;
      max: number;
    };
  };
}

// Update to use string enum values for type safety
export enum SortPattern {
  ARTIST = 'artist',
  ALBUM_ARTIST = 'album-artist',
  ALBUM = 'album',
  GENRE = 'genre',
  YEAR = 'year',
  CUSTOM = 'custom'
}

export interface SortOptions {
  pattern: SortPattern;
  copyMode: boolean;
  nestedStructure: boolean;
  includeArtistInAlbumFolder: boolean;
  template?: string;
  progressCallback?: SortProgressCallback; // Add progress callback to options
}

export interface SortProgressInfo {
  total: number;
  processed: number;
  succeeded: number;
  failed: number;
  currentFile?: string;
}

export type SortProgressCallback = (progress: SortProgressInfo) => void;