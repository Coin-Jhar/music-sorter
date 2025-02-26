// src/config/constants.ts
export const PATHS = {
  SOURCE: '/data/data/com.termux/files/home/storage/music/Telegram',
  TARGET: '/data/data/com.termux/files/home/storage/music/Telegram/sorted-music'
};

export const SUPPORTED_EXTENSIONS = ['.mp3', '.flac', '.wav', '.ogg', '.m4a', '.aac'];

export const SORT_PATTERNS = {
  ARTIST_FOLDER: 'by-artist',
  ALBUM_ARTIST_FOLDER: 'by-album-artist',
  ALBUM_FOLDER: 'by-album',
  GENRE_FOLDER: 'by-genre',
  YEAR_FOLDER: 'by-year'
};

export const DEFAULT_CONFIG = {
  copyInsteadOfMove: false,
  includeSubfolders: true,
  sortingPattern: 'artist/album'
};
