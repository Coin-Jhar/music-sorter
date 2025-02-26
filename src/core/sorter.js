"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MusicSorter = void 0;
const constants_1 = require("../config/constants");
const path_1 = __importDefault(require("path"));
class MusicSorter {
    constructor(fileOps) {
        this.fileOps = fileOps;
    }
    sortByArtist(musicFiles_1) {
        return __awaiter(this, arguments, void 0, function* (musicFiles, copyMode = false) {
            console.log(`Sorting ${musicFiles.length} files by artist...`);
            for (const file of musicFiles) {
                const artist = file.metadata.artist || 'Unknown Artist';
                // Sanitize folder name to avoid special characters
                const sanitizedArtist = artist.replace(/[\/\\:*?"<>|]/g, '_');
                const relativePath = path_1.default.join(constants_1.SORT_PATTERNS.ARTIST_FOLDER, sanitizedArtist, path_1.default.basename(file.path));
                if (copyMode) {
                    yield this.fileOps.copyFile(file.path, relativePath);
                }
                else {
                    yield this.fileOps.moveFile(file.path, relativePath);
                }
            }
        });
    }
    sortByAlbum(musicFiles_1) {
        return __awaiter(this, arguments, void 0, function* (musicFiles, copyMode = false) {
            console.log(`Sorting ${musicFiles.length} files by album...`);
            for (const file of musicFiles) {
                const artist = file.metadata.artist || 'Unknown Artist';
                const album = file.metadata.album || 'Unknown Album';
                // Sanitize folder names
                const sanitizedArtist = artist.replace(/[\/\\:*?"<>|]/g, '_');
                const sanitizedAlbum = album.replace(/[\/\\:*?"<>|]/g, '_');
                const relativePath = path_1.default.join(constants_1.SORT_PATTERNS.ALBUM_FOLDER, sanitizedArtist, sanitizedAlbum, path_1.default.basename(file.path));
                if (copyMode) {
                    yield this.fileOps.copyFile(file.path, relativePath);
                }
                else {
                    yield this.fileOps.moveFile(file.path, relativePath);
                }
            }
        });
    }
    sortByGenre(musicFiles_1) {
        return __awaiter(this, arguments, void 0, function* (musicFiles, copyMode = false) {
            console.log(`Sorting ${musicFiles.length} files by genre...`);
            for (const file of musicFiles) {
                const genre = file.metadata.genre || 'Unknown Genre';
                const sanitizedGenre = genre.replace(/[\/\\:*?"<>|]/g, '_');
                const relativePath = path_1.default.join(constants_1.SORT_PATTERNS.GENRE_FOLDER, sanitizedGenre, path_1.default.basename(file.path));
                if (copyMode) {
                    yield this.fileOps.copyFile(file.path, relativePath);
                }
                else {
                    yield this.fileOps.moveFile(file.path, relativePath);
                }
            }
        });
    }
    sortByYear(musicFiles_1) {
        return __awaiter(this, arguments, void 0, function* (musicFiles, copyMode = false) {
            console.log(`Sorting ${musicFiles.length} files by year...`);
            for (const file of musicFiles) {
                const year = file.metadata.year ? file.metadata.year.toString() : 'Unknown Year';
                const relativePath = path_1.default.join(constants_1.SORT_PATTERNS.YEAR_FOLDER, year, path_1.default.basename(file.path));
                if (copyMode) {
                    yield this.fileOps.copyFile(file.path, relativePath);
                }
                else {
                    yield this.fileOps.moveFile(file.path, relativePath);
                }
            }
        });
    }
}
exports.MusicSorter = MusicSorter;
