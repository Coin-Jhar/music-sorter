"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.MetadataService = void 0;
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const mm = __importStar(require("music-metadata"));
class MetadataService {
    extractMetadata(filePaths) {
        return __awaiter(this, void 0, void 0, function* () {
            const musicFiles = [];
            for (const filePath of filePaths) {
                try {
                    const stats = yield promises_1.default.stat(filePath);
                    if (!stats.isFile())
                        continue;
                    const extension = path_1.default.extname(filePath).toLowerCase();
                    if (!['.mp3', '.flac', '.wav', '.ogg', '.m4a'].includes(extension))
                        continue;
                    const metadata = yield this.parseMetadata(filePath);
                    musicFiles.push({
                        path: filePath,
                        filename: path_1.default.basename(filePath),
                        extension,
                        size: stats.size,
                        metadata
                    });
                }
                catch (error) {
                    console.error(`Error processing ${filePath}:`, error);
                }
            }
            return musicFiles;
        });
    }
    parseMetadata(filePath) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const metadata = yield mm.parseFile(filePath);
                return {
                    title: metadata.common.title,
                    artist: metadata.common.artist,
                    album: metadata.common.album,
                    year: metadata.common.year,
                    genre: (_a = metadata.common.genre) === null || _a === void 0 ? void 0 : _a[0],
                    trackNumber: (_b = metadata.common.track.no) !== null && _b !== void 0 ? _b : undefined // Convert null to undefined
                };
            }
            catch (error) {
                console.error(`Error extracting metadata from ${filePath}:`, error);
                return {};
            }
        });
    }
}
exports.MetadataService = MetadataService;
