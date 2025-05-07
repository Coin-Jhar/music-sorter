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
exports.FileOperations = void 0;
// src/utils/file-operations.ts
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const constants_1 = require("../config/constants");
class FileOperations {
    ensureDirectoryExists(dir) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield promises_1.default.access(dir);
            }
            catch (_a) {
                yield promises_1.default.mkdir(dir, { recursive: true });
            }
        });
    }
    scanDirectory() {
        return __awaiter(this, arguments, void 0, function* (dir = constants_1.PATHS.SOURCE) {
            yield this.ensureDirectoryExists(dir);
            const allFiles = [];
            const entries = yield promises_1.default.readdir(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path_1.default.join(dir, entry.name);
                if (entry.isDirectory()) {
                    const subFiles = yield this.scanDirectory(fullPath);
                    allFiles.push(...subFiles);
                }
                else {
                    allFiles.push(fullPath);
                }
            }
            return allFiles;
        });
    }
    moveFile(sourcePath, destPath) {
        return __awaiter(this, void 0, void 0, function* () {
            const targetPath = path_1.default.join(constants_1.PATHS.TARGET, destPath);
            const destDir = path_1.default.dirname(targetPath);
            yield this.ensureDirectoryExists(destDir);
            try {
                yield promises_1.default.rename(sourcePath, targetPath);
                console.log(`Moved: ${path_1.default.basename(sourcePath)} -> ${targetPath}`);
            }
            catch (error) {
                console.error(`Error moving file ${sourcePath}:`, error);
            }
        });
    }
    copyFile(sourcePath, destPath) {
        return __awaiter(this, void 0, void 0, function* () {
            const targetPath = path_1.default.join(constants_1.PATHS.TARGET, destPath);
            const destDir = path_1.default.dirname(targetPath);
            yield this.ensureDirectoryExists(destDir);
            try {
                yield promises_1.default.copyFile(sourcePath, targetPath);
                console.log(`Copied: ${path_1.default.basename(sourcePath)} -> ${targetPath}`);
            }
            catch (error) {
                console.error(`Error copying file ${sourcePath}:`, error);
            }
        });
    }
}
exports.FileOperations = FileOperations;
