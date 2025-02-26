"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_CONFIG = exports.SORT_PATTERNS = exports.SUPPORTED_EXTENSIONS = exports.PATHS = void 0;
// src/config/constants.ts
exports.PATHS = {
    SOURCE: '/data/data/com.termux/files/home/storage/music/Telegram',
    TARGET: '/data/data/com.termux/files/home/storage/music/Telegram/sorted-music'
};
exports.SUPPORTED_EXTENSIONS = ['.mp3', '.flac', '.wav', '.ogg', '.m4a', '.aac'];
exports.SORT_PATTERNS = {
    ARTIST_FOLDER: 'by-artist',
    ALBUM_FOLDER: 'by-album',
    GENRE_FOLDER: 'by-genre',
    YEAR_FOLDER: 'by-year'
};
exports.DEFAULT_CONFIG = {
    copyInsteadOfMove: false,
    includeSubfolders: true,
    sortingPattern: 'artist/album'
};
