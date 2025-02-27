// src/config/settings-manager.ts
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { PATHS, SUPPORTED_EXTENSIONS, SORT_PATTERNS } from './constants';
import { logger } from '../utils/logger';

export interface UserSettings {
  sourcePath: string;
  targetPath: string;
  defaultSortPattern: string;
  defaultRenamePattern: string;
  copyByDefault: boolean;
  includeSubfolders: boolean;
  lastUsedPattern?: string;
  customPatterns?: {
    rename: string[];
    sort: string[];
  };
}

class SettingsManager {
  private settings: UserSettings;
  private settingsPath: string;
  private initialized: boolean = false;
  
  constructor() {
    // Store settings in user's home directory
    this.settingsPath = path.join(os.homedir(), '.music-sorter.json');
    this.settings = this.getDefaultSettings();
  }
  
  private getDefaultSettings(): UserSettings {
    return {
      sourcePath: PATHS.SOURCE,
      targetPath: PATHS.TARGET,
      defaultSortPattern: 'artist',
      defaultRenamePattern: '{artist} - {title}',
      copyByDefault: false,
      includeSubfolders: true,
      customPatterns: {
        rename: [
          '{artist} - {title}',
          '{track} - {artist} - {title}',
          '{artist} - {album} - {track} - {title}'
        ],
        sort: []
      }
    };
  }
  
  /**
   * Initialize settings by loading from file
   * Returns a promise that resolves when settings are loaded
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      await this.loadSettings();
      this.initialized = true;
      logger.info('Settings loaded successfully');
    } catch (error) {
      logger.warn('Could not load settings, using defaults');
      await this.saveSettings();
      this.initialized = true;
    }
  }
  
  /**
   * Ensure settings are initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }
  
  /**
   * Load settings from file
   */
  async loadSettings(): Promise<void> {
    try {
      const data = await fs.readFile(this.settingsPath, 'utf-8');
      const loadedSettings = JSON.parse(data);
      
      // Merge with default settings to ensure all fields exist
      this.settings = { 
        ...this.getDefaultSettings(),
        ...loadedSettings
      };
      
      logger.info(`Settings loaded from ${this.settingsPath}`);
    } catch (error) {
      logger.warn(`Could not load settings from ${this.settingsPath}`);
      throw error;
    }
  }
  
  /**
   * Save settings to file
   */
  async saveSettings(): Promise<void> {
    try {
      await fs.writeFile(
        this.settingsPath, 
        JSON.stringify(this.settings, null, 2)
      );
      logger.info(`Settings saved to ${this.settingsPath}`);
    } catch (error) {
      logger.error('Failed to save settings:', error as Error);
      throw error;
    }
  }
  
  /**
   * Get a specific setting value
   */
  async get<K extends keyof UserSettings>(key: K): Promise<UserSettings[K]> {
    await this.ensureInitialized();
    return this.settings[key];
  }
  
  /**
   * Get all settings
   */
  async getAll(): Promise<UserSettings> {
    await this.ensureInitialized();
    return { ...this.settings };
  }
  
  /**
   * Set a specific setting value
   */
  async set<K extends keyof UserSettings>(key: K, value: UserSettings[K]): Promise<void> {
    await this.ensureInitialized();
    this.settings[key] = value;
    await this.saveSettings();
  }
  
  /**
   * Update multiple settings at once
   */
  async updateSettings(settingsUpdate: Partial<UserSettings>): Promise<void> {
    await this.ensureInitialized();
    this.settings = { ...this.settings, ...settingsUpdate };
    await this.saveSettings();
  }
  
  /**
   * Add a custom pattern
   */
  async addCustomPattern(type: 'rename' | 'sort', pattern: string): Promise<void> {
    await this.ensureInitialized();
    
    if (!this.settings.customPatterns) {
      this.settings.customPatterns = { rename: [], sort: [] };
    }
    
    // Don't add duplicates
    if (!this.settings.customPatterns[type].includes(pattern)) {
      this.settings.customPatterns[type].push(pattern);
      await this.saveSettings();
    }
  }
  
  /**
   * Remove a custom pattern
   */
  async removeCustomPattern(type: 'rename' | 'sort', pattern: string): Promise<void> {
    await this.ensureInitialized();
    
    if (this.settings.customPatterns && this.settings.customPatterns[type]) {
      const index = this.settings.customPatterns[type].indexOf(pattern);
      if (index !== -1) {
        this.settings.customPatterns[type].splice(index, 1);
        await this.saveSettings();
      }
    }
  }
  
  /**
   * Reset settings to defaults
   */
  async resetToDefaults(): Promise<void> {
    this.settings = this.getDefaultSettings();
    await this.saveSettings();
    logger.info('Settings reset to defaults');
  }
}

// Export a singleton instance
export const settingsManager = new SettingsManager();
