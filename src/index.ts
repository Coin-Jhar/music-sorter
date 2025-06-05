// src/index.ts
import { Command } from 'commander';
import { setupCommands } from './commands/command-registry';
import { logger } from './utils/logger';

async function main() {
  try {
    const program = new Command();
    
    program
      .name('music-sorter')
      .description('Sort and organize music files')
      .version('1.0.0')
      // Disallow extra arguments so unexpected inputs cause an error
      .allowExcessArguments(false);
    
    setupCommands(program);
    
    // Enable better error handling
    program.configureOutput({
      outputError: (str, write) => {
        logger.error(str);
      }
    });
    
    await program.parseAsync(process.argv);
  } catch (error) {
    logger.error('Error in main execution:', error as Error);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Critical error:', error);
  process.exit(1);
});
