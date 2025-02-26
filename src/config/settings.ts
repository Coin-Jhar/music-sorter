// src/config/settings.ts
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { APP_CONFIG } from './app-config';

interface UserSettings {
  sourcePath: string;
  targetPath: string;
  defaultPattern: string;
  copyByDefault: boolean;
  renamePattern: string;
}

class SettingsManager {
  private settings: UserSettings;
  private readonly settingsPath: string;
  
  constructor() {
    this.settingsPath = path.join(os.homedir(), '.music-sorter.json');
    this.settings = this.getDefaultSettings();
    this.initialize();
  }
  
  private getDefaultSettings(): UserSettings {
    return {
      sourcePath: APP_CONFIG.PATHS.SOURCE,
      targetPath: APP_CONFIG.PATHS.TARGET,
      defaultPattern: APP_CONFIG.DEFAULT_SORT_PATTERN,
      copyByDefault: APP_CONFIG.DEFAULT_COPY_MODE,
      renamePattern: APP_CONFIG.DEFAULT_RENAME_PATTERN
    };
  }
  
  private async initialize(): Promise<void> {
    try {
      await this.loadSettings();
    } catch (error) {
      // If loading fails, use defaults and save them
      await this.saveSettings();
    }
  }
  
  async loadSettings(): Promise<void> {
    try {
      const data = await fs.readFile(this.settingsPath, 'utf-8');
      this.settings = { ...this.settings, ...JSON.parse(data) };
    } catch {
      // If file doesn't exist, use defaults
      await this.saveSettings();
    }
  }
  
  async saveSettings(): Promise<void> {
    try {
      await fs.writeFile(
        this.settingsPath, 
        JSON.stringify(this.settings, null, 2)
      );
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }
  
  get<K extends keyof UserSettings>(key: K): UserSettings[K] {
    return this.settings[key];
  }
  
  async set<K extends keyof UserSettings>(key: K, value: UserSettings[K]): Promise<void> {
    this.settings[key] = value;
    await this.saveSettings();
  }
}

export const settingsManager = new SettingsManager();
