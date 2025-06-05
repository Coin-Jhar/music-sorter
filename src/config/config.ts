import path from 'path';
import os from 'os';
import fs from 'fs/promises';

interface Config {
  sourcePath: string;
  targetPath: string;
  isTermux: boolean;
  supportedExtensions: string[];
  sortPatterns: {
    [key: string]: string;
  };
  defaultConfig: {
    copyInsteadOfMove: boolean;
    includeSubfolders: boolean;
    sortingPattern: string;
  };
}

// Default paths based on OS
const getDefaultPaths = () => {
  const isTermux = process.env.TERMUX_VERSION !== undefined;
  const homeDir = os.homedir();
  
  if (isTermux) {
    return {
      sourcePath: '/data/data/com.termux/files/home/storage/music/Telegram',
      targetPath: '/data/data/com.termux/files/home/storage/music/Telegram/sorted-music'
    };
  } else {
    return {
      sourcePath: path.join(homeDir, 'Music'),
      targetPath: path.join(homeDir, 'Music', 'sorted-music')
    };
  }
};

// Load config from file if it exists
const loadConfig = async (): Promise<Config> => {
  const configPath = path.join(os.homedir(), '.music-sorter', 'config.json');
  
  try {
    await fs.access(configPath);
    const configData = await fs.readFile(configPath, 'utf-8');
    return JSON.parse(configData);
  } catch {
    // If config doesn't exist, create default
    const defaultPaths = getDefaultPaths();
    const defaultConfig: Config = {
      ...defaultPaths,
      isTermux: process.env.TERMUX_VERSION !== undefined,
      supportedExtensions: ['.mp3', '.flac', '.wav', '.ogg', '.m4a', '.aac'],
      sortPatterns: {
        ARTIST_FOLDER: 'by-artist',
        ALBUM_ARTIST_FOLDER: 'by-album-artist',
        ALBUM_FOLDER: 'by-album',
        GENRE_FOLDER: 'by-genre',
        YEAR_FOLDER: 'by-year',
        CUSTOM_FOLDER: 'by-custom'
      },
      defaultConfig: {
        copyInsteadOfMove: false,
        includeSubfolders: true,
        sortingPattern: 'artist/album'
      }
    };

    // Create config directory if it doesn't exist
    await fs.mkdir(path.dirname(configPath), { recursive: true });
    await fs.writeFile(configPath, JSON.stringify(defaultConfig, null, 2));
    
    return defaultConfig;
  }
};

export const config = await loadConfig(); 
