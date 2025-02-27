// src/commands/settings-command.ts
import { Command } from 'commander';
import { settingsManager } from '../config/settings-manager';
import { logger } from '../utils/logger';

export function settingsCommand(program: Command): void {
  const settingsCmd = program
    .command('settings')
    .description('Manage application settings');
  
  // Show all settings
  settingsCmd
    .command('show')
    .description('Show current settings')
    .action(async () => {
      try {
        const settings = await settingsManager.getAll();
        console.log(JSON.stringify(settings, null, 2));
        logger.success('Settings displayed successfully');
      } catch (error) {
        logger.error('Failed to display settings:', error as Error);
      }
    });
  
  // Set a specific setting
  settingsCmd
    .command('set <key> <value>')
    .description('Set a specific setting value')
    .action(async (key, value) => {
      try {
        // Parse value based on expected type
        let parsedValue: any = value;
        
        // Handle boolean values
        if (value.toLowerCase() === 'true') parsedValue = true;
        else if (value.toLowerCase() === 'false') parsedValue = false;
        // Handle numeric values
        else if (!isNaN(Number(value))) parsedValue = Number(value);
        
        await settingsManager.set(key as any, parsedValue);
        logger.success(`Setting '${key}' updated to '${value}'`);
      } catch (error) {
        logger.error(`Failed to update setting '${key}':`, error as Error);
      }
    });
  
  // Reset settings to defaults
  settingsCmd
    .command('reset')
    .description('Reset all settings to default values')
    .action(async () => {
      try {
        await settingsManager.resetToDefaults();
        logger.success('Settings reset to defaults');
      } catch (error) {
        logger.error('Failed to reset settings:', error as Error);
      }
    });
  
  // Add a custom pattern
  settingsCmd
    .command('add-pattern <type> <pattern>')
    .description('Add a custom pattern (type: rename or sort)')
    .action(async (type, pattern) => {
      if (type !== 'rename' && type !== 'sort') {
        logger.error('Type must be either "rename" or "sort"');
        return;
      }
      
      try {
        await settingsManager.addCustomPattern(type, pattern);
        logger.success(`Added custom ${type} pattern: ${pattern}`);
      } catch (error) {
        logger.error(`Failed to add custom ${type} pattern:`, error as Error);
      }
    });
  
  // Remove a custom pattern
  settingsCmd
    .command('remove-pattern <type> <pattern>')
    .description('Remove a custom pattern (type: rename or sort)')
    .action(async (type, pattern) => {
      if (type !== 'rename' && type !== 'sort') {
        logger.error('Type must be either "rename" or "sort"');
        return;
      }
      
      try {
        await settingsManager.removeCustomPattern(type, pattern);
        logger.success(`Removed custom ${type} pattern: ${pattern}`);
      } catch (error) {
        logger.error(`Failed to remove custom ${type} pattern:`, error as Error);
      }
    });
}
