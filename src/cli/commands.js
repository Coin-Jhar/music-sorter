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
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupCLI = setupCLI;
// src/cli/commands.ts
const commander_1 = require("commander");
const sorter_1 = require("../core/sorter");
const metadata_service_1 = require("../services/metadata-service");
const file_operations_1 = require("../utils/file-operations");
const constants_1 = require("../config/constants");
function setupCLI() {
    const program = new commander_1.Command();
    program
        .name('music-sorter')
        .description('Sort music files from Telegram in Termux')
        .version('1.0.0');
    program
        .command('sort')
        .description('Sort music files')
        .option('-s, --source <path>', 'Source directory', constants_1.PATHS.SOURCE)
        .option('-d, --destination <path>', 'Destination directory', constants_1.PATHS.TARGET)
        .option('-p, --pattern <pattern>', 'Sorting pattern (artist, album, genre, year)', 'artist')
        .option('-c, --copy', 'Copy files instead of moving them', false)
        .action((options) => __awaiter(this, void 0, void 0, function* () {
        console.log(`Starting music sorter...`);
        console.log(`Source: ${options.source}`);
        console.log(`Destination: ${options.destination}`);
        console.log(`Pattern: ${options.pattern}`);
        console.log(`Copy mode: ${options.copy ? 'Yes' : 'No'}`);
        try {
            const fileOps = new file_operations_1.FileOperations();
            const metadataService = new metadata_service_1.MetadataService();
            const musicSorter = new sorter_1.MusicSorter(fileOps);
            // Make sure target directory exists
            yield fileOps.ensureDirectoryExists(options.destination);
            console.log('Scanning files...');
            const files = yield fileOps.scanDirectory(options.source);
            console.log(`Found ${files.length} files.`);
            console.log('Extracting metadata...');
            const musicFiles = yield metadataService.extractMetadata(files);
            console.log(`Processed ${musicFiles.length} music files.`);
            switch (options.pattern) {
                case 'artist':
                    yield musicSorter.sortByArtist(musicFiles, options.copy);
                    break;
                case 'album':
                    yield musicSorter.sortByAlbum(musicFiles, options.copy);
                    break;
                case 'genre':
                    yield musicSorter.sortByGenre(musicFiles, options.copy);
                    break;
                case 'year':
                    yield musicSorter.sortByYear(musicFiles, options.copy);
                    break;
                default:
                    console.error(`Unknown pattern: ${options.pattern}`);
            }
            console.log('Sorting complete!');
        }
        catch (error) {
            console.error('Error during sorting:', error);
        }
    }));
    program
        .command('analyze')
        .description('Analyze music collection without sorting')
        .option('-s, --source <path>', 'Source directory', constants_1.PATHS.SOURCE)
        .action((options) => __awaiter(this, void 0, void 0, function* () {
        try {
            const fileOps = new file_operations_1.FileOperations();
            const metadataService = new metadata_service_1.MetadataService();
            console.log('Scanning files...');
            const files = yield fileOps.scanDirectory(options.source);
            console.log(`Found ${files.length} files.`);
            console.log('Extracting metadata...');
            const musicFiles = yield metadataService.extractMetadata(files);
            // Count artists, albums, genres
            const artists = new Set(musicFiles.map(f => f.metadata.artist || 'Unknown'));
            const albums = new Set(musicFiles.map(f => f.metadata.album || 'Unknown'));
            const genres = new Set(musicFiles.map(f => f.metadata.genre || 'Unknown'));
            console.log(`Analysis complete!`);
            console.log(`Total music files: ${musicFiles.length}`);
            console.log(`Unique artists: ${artists.size}`);
            console.log(`Unique albums: ${albums.size}`);
            console.log(`Unique genres: ${genres.size}`);
        }
        catch (error) {
            console.error('Error during analysis:', error);
        }
    }));
    return program;
}
