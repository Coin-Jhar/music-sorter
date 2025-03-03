// src/commands/help-command.ts
import { Command } from 'commander';
import { logger } from '../utils/logger';

export function helpCommand(program: Command): void {
  program
    .command('commands')
    .description('Show all available commands')
    .action(() => {
      logger.info('Music Sorter - Available Commands:');
      logger.info('');
      
      logger.info('🔹 sort - Sort music files');
      logger.info('   Options:');
      logger.info('   -s, --source <path>         Source directory');
      logger.info('   -d, --destination <path>    Destination directory');
      logger.info('   -p, --pattern <pattern>     Sorting pattern (artist, album-artist, album, genre, year)');
      logger.info('   -c, --copy                  Copy files instead of moving them');
      logger.info('');
      
      logger.info('🔹 rename - Rename music files based on their metadata');
      logger.info('   Options:');
      logger.info('   -s, --source <path>         Source directory');
      logger.info('   -p, --pattern <pattern>     Rename pattern (e.g., "{artist} - {title}")');
      logger.info('   -d, --dry-run               Preview changes without renaming files');
      logger.info('');
      
      logger.info('🔹 analyze - Analyze music collection without sorting');
      logger.info('   Options:');
      logger.info('   -s, --source <path>         Source directory');
      logger.info('');
      
      logger.info('🔹 undo - Undo sorting and move all files back to source directory');
      logger.info('');
      
      logger.info('🔹 server - Start the web server interface');
      logger.info('   Options:');
      logger.info('   -p, --port <port>           Port to run the server on (default: 3000)');
      logger.info('');
      
      logger.info('🔹 settings - Manage application settings');
      logger.info('   Subcommands:');
      logger.info('   show                        Show current settings');
      logger.info('   set <key> <value>           Set a specific setting value');
      logger.info('   reset                       Reset all settings to default values');
      logger.info('   add-pattern <type> <pattern>    Add a custom pattern (type: rename or sort)');
      logger.info('   remove-pattern <type> <pattern> Remove a custom pattern (type: rename or sort)');
      logger.info('');
      
      logger.info('🔹 help - Display help information');
      logger.info('🔹 commands - Display this list of commands');
      logger.info('');
      
      logger.info('Examples:');
      logger.info('  music-sorter sort --pattern artist --copy');
      logger.info('  music-sorter rename --pattern "{artist} - {title}" --dry-run');
      logger.info('  music-sorter server --port 8080');
    });
}
