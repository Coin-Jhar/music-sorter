// src/config/settings-manager.ts
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { PATHS, SUPPORTED_EXTENSIONS, SORT_PATTERNS } from './constants';
import { logger } from '../utils/logger';
import { AppError, ErrorCategory, createAppError } from '../utils/error-handler';

export interface CustomPatterns {
  rename: string[];
  sort: string[];
}

export interface UserSettings {
  sourcePath: string;
  targetPath: string;
  defaultSortPattern: string;
  defaultRenamePattern: string;
  copyByDefault: boolean;
  includeSubfolders: boolean;
  lastUsedPattern?: string;
  customPatterns: CustomPatterns;
  lastModified: number;
  ignorePatterns?: string[];
  maxConcurrentOperations?: number;
  darkMode?: boolean;
}

type SettingsKey = keyof UserSettings;

export class SettingsManager {
  private settings: UserSettings;
  private settingsPath: string;
  private initialized: boolean = false;
  private saveDebounceTimeout: NodeJS.Timeout | null = null;
  private saveDebounceTime: number = 500; // ms
  
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
      lastModified: Date.now(),
      customPatterns: {
        rename: [
          '{artist} - {title}',
          '{track} - {artist} - {title}',
          '{artist} - {album} - {track} - {title}'
        ],
        sort: []
      },
      ignorePatterns: [
        '\\.DS_Store$',
        'Thumbs\\.db$',
        'desktop\\.ini$'
      ],
      maxConcurrentOperations: 50
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
   * Validate settings structure and fill in missing values
   */
  private validateSettings(loadedSettings: Partial<UserSettings>): UserSettings {
    const defaultSettings = this.getDefaultSettings();
    const result: UserSettings = { ...defaultSettings };
    
    // Update each field if it's present and of the right type
    for (const [key, value] of Object.entries(loadedSettings)) {
      const typedKey = key as keyof UserSettings;
      const defaultValue = defaultSettings[typedKey];
      
      // Type validation
      if (typeof value === typeof defaultValue) {
        // @ts-ignore - we validated the type above
        result[typedKey] = value;
      }
    }
    
    // Ensure custom patterns structure
    if (!result.customPatterns) {
      result.customPatterns = defaultSettings.customPatterns;
    } else {
      if (!Array.isArray(result.customPatterns.rename)) {
        result.customPatterns.rename = defaultSettings.customPatterns.rename;
      }
      if (!Array.isArray(result.customPatterns.sort)) {
        result.customPatterns.sort = defaultSettings.customPatterns.sort;
      }
    }
    
    // Update lastModified timestamp
    result.lastModified = Date.now();
    
    return result;
  }
  
  /**
   * Load settings from file
   */
  async loadSettings(): Promise<void> {
    try {
      const data = await fs.readFile(this.settingsPath, 'utf-8');
      let loadedSettings: Partial<UserSettings>;
      
      try {
        loadedSettings = JSON.parse(data);
      } catch (parseError) {
        throw createAppError(
          ErrorCategory.SETTINGS,
          'Invalid settings file format',
          parseError as Error,
          { path: this.settingsPath }
        );
      }
      
      // Validate and merge with defaults
      this.settings = this.validateSettings(loadedSettings);
      
      logger.info(`Settings loaded from ${this.settingsPath}`);
    } catch (error) {
      if (!(error instanceof AppError)) {
        throw createAppError(
          ErrorCategory.SETTINGS,
          `Could not load settings from ${this.settingsPath}`,
          error as Error,
          { path: this.settingsPath }
        );
      }
      throw error;
    }
  }
  
  /**
   * Save settings to file
   */
  async saveSettings(): Promise<void> {
    try {
      // Update lastModified timestamp
      this.settings.lastModified = Date.now();
      
      await fs.writeFile(
        this.settingsPath, 
        JSON.stringify(this.settings, null, 2)
      );
      logger.info(`Settings saved to ${this.settingsPath}`);
    } catch (error) {
      throw createAppError(
        ErrorCategory.SETTINGS,
        'Failed to save settings',
        error as Error,
        { path: this.settingsPath }
      );
    }
  }
  
  /**
   * Save settings with debouncing to prevent excessive writes
   */
  private debouncedSave(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.saveDebounceTimeout) {
        clearTimeout(this.saveDebounceTimeout);
      }
      
      this.saveDebounceTimeout = setTimeout(() => {
        this.saveSettings()
          .then(resolve)
          .catch(reject);
        this.saveDebounceTimeout = null;
      }, this.saveDebounceTime);
    });
  }
  
  /**
   * Get a specific setting value
   */
  async get<K extends SettingsKey>(key: K): Promise<UserSettings[K]> {
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
  async set<K extends SettingsKey>(key: K, value: UserSettings[K]): Promise<void> {
    await this.ensureInitialized();
    this.settings[key] = value;
    await this.debouncedSave();
  }
  
  /**
   * Update multiple settings at once
   */
  async updateSettings(settingsUpdate: Partial<UserSettings>): Promise<void> {
    await this.ensureInitialized();
    this.settings = { ...this.settings, ...settingsUpdate };
    await this.debouncedSave();
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
      await this.debouncedSave();
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
        await this.debouncedSave();
      }
    }
  }
  
  /**
   * Get compiled RegExp patterns from ignorePatterns setting
   */
  async getIgnorePatternRegexps(): Promise<RegExp[]> {
    await this.ensureInitialized();
    
    const patterns = this.settings.ignorePatterns || [];
    return patterns.map(pattern => new RegExp(pattern));
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
