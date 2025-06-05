// src/config/constants.ts
export const PATHS = {
  SOURCE: '/data/data/com.termux/files/home/storage/music/Telegram',
  TARGET: '/data/data/com.termux/files/home/storage/music/Telegram/sorted-music'
};

export const SUPPORTED_EXTENSIONS = ['.mp3', '.flac', '.wav', '.ogg', '.m4a', '.aac'];

export const SORT_PATTERNS = {
  ARTIST_FOLDER: 'by-artist',
  ALBUM_ARTIST_FOLDER: 'by-album-artist',  // Fixed missing entry
  ALBUM_FOLDER: 'by-album',
  GENRE_FOLDER: 'by-genre',
  YEAR_FOLDER: 'by-year',
  CUSTOM_FOLDER: 'by-custom'
};

export const DEFAULT_CONFIG = {
  copyInsteadOfMove: false,
  includeSubfolders: true,
  sortingPattern: 'artist/album'
};

export const RENAME_PATTERNS = {
  STANDARD: '{artist} - {title}',
  WITH_TRACK: '{track} - {artist} - {title}',
  ARTIST_ALBUM_TRACK: '{artist} - {album} - {track} - {title}',
  YEAR_ALBUM_TRACK: '{year} - {album} - {track} - {title}'
};

// Time in milliseconds for various operations
export const TIMEOUTS = {
  DEBOUNCE_SAVE: 500,
  PROGRESS_UPDATE: 100,
  OPERATION_FAILURE_RETRY: 1000,
  UI_NOTIFICATION: 5000
};

// Maximum number of retries for failed operations
export const MAX_RETRIES = 3;

// Maximum number of concurrent file operations
export const MAX_CONCURRENT_OPERATIONS = 50;

// Default log file path
export const DEFAULT_LOG_PATH = 'logs/music-sorter.log';
