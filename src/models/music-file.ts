// src/models/music-file.ts
export interface MusicMetadata {
  title?: string;
  artist?: string;
  albumArtist?: string;
  album?: string;
  year?: number;
  genre?: string;
  trackNumber?: number;
}

export interface MusicFile {
  path: string;
  filename: string;
  extension: string;
  size: number;
  metadata: MusicMetadata;
}
