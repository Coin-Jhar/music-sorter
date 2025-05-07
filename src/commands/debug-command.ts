// src/commands/debug-command.ts
import { Command } from 'commander';
import { logger } from '../utils/logger';
import { settingsManager } from '../config/settings-manager';
import { PATHS, SUPPORTED_EXTENSIONS, SORT_PATTERNS } from '../config/constants';
import os from 'os';
import path from 'path';
import fs from 'fs/promises';

export function debugCommand(program: Command): void {
  const debug = program
    .command('debug')
    .description('Debug command to diagnose issues');
  
  // Add individual options  
  debug.option('--show-env', 'Show environment details');
  debug.option('--show-paths', 'Show path settings');
  debug.option('--test-paths', 'Test if paths exist');
  debug.option('--show-settings', 'Show all settings');
  debug.option('--all', 'Show all debug information');
  
  debug.action(async (options) => {
    // Log options for debugging
    console.log('Debug command received options:', options);
    console.log('Command line args:', process.argv);
    
    // Always show all debug info by default
    let showAll = true;
    
    // If any specific option is explicitly set, don't show all by default
    if (options.showEnv || options.showPaths || options.testPaths || options.showSettings) {
      showAll = false;
    }
    
    // Allow explicit override with --all
    if (options.all) {
      showAll = true;
    }
    
    // Show environment details
    if (showAll || options.showEnv) {
      logger.info('\n📌 Environment Details:');
      logger.info('====================');
      logger.info(`OS Platform: ${os.platform()}`);
      logger.info(`OS Release: ${os.release()}`);
      logger.info(`OS Architecture: ${os.arch()}`);
      logger.info(`Node.js Version: ${process.version}`);
      logger.info(`User Home Directory: ${os.homedir()}`);
      logger.info(`Current Working Directory: ${process.cwd()}`);
      logger.info(`Settings File Location: ${path.join(os.homedir(), '.music-sorter.json')}`);
    }
    
    // Show path settings
    if (showAll || options.showPaths) {
      logger.info('\n📌 Path Settings:');
      logger.info('====================');
      logger.info(`Source Path (default): ${PATHS.SOURCE}`);
      logger.info(`Target Path (default): ${PATHS.TARGET}`);
      logger.info(`Supported Extensions: ${SUPPORTED_EXTENSIONS.join(', ')}`);
      
      // Show all sort patterns
      logger.info('\nSort Patterns:');
      for (const [key, value] of Object.entries(SORT_PATTERNS)) {
        logger.info(`  ${key}: ${value}`);
      }
    }
    
    // Test if paths exist
    if (showAll || options.testPaths) {
      logger.info('\n📌 Path Tests:');
      logger.info('====================');
      
      // Test default paths
      try {
        await fs.access(PATHS.SOURCE);
        logger.info(`Default Source Path (${PATHS.SOURCE}): ✅ Exists`);
      } catch (error) {
        logger.error(`Default Source Path (${PATHS.SOURCE}): ❌ Not accessible`);
      }
      
      try {
        await fs.access(PATHS.TARGET);
        logger.info(`Default Target Path (${PATHS.TARGET}): ✅ Exists`);
      } catch (error) {
        logger.error(`Default Target Path (${PATHS.TARGET}): ❌ Not accessible`);
      }
      
      // Test settings paths
      try {
        await settingsManager.initialize();
        const settings = await settingsManager.getAll();
        
        try {
          await fs.access(settings.sourcePath);
          logger.info(`Custom Source Path (${settings.sourcePath}): ✅ Exists`);
        } catch (error) {
          logger.error(`Custom Source Path (${settings.sourcePath}): ❌ Not accessible`);
        }
        
        try {
          await fs.access(settings.targetPath);
          logger.info(`Custom Target Path (${settings.targetPath}): ✅ Exists`);
        } catch (error) {
          logger.error(`Custom Target Path (${settings.targetPath}): ❌ Not accessible`);
        }
      } catch (error) {
        logger.error('Could not load settings to test custom paths');
      }
    }
    
    // Show all settings
    if (showAll || options.showSettings) {
      logger.info('\n📌 User Settings:');
      logger.info('====================');
      try {
        await settingsManager.initialize();
        const settings = await settingsManager.getAll();
        console.log(JSON.stringify(settings, null, 2));
      } catch (error) {
        logger.error('Could not load settings:', error as Error);
      }
    }
    
    logger.success('Debug information displayed');
  });
}
