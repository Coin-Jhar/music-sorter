// src/index.ts
import { Command } from 'commander';
import { setupCommands } from './commands/command-registry';

async function main() {
  const program = new Command();
  
  program
    .name('music-sorter')
    .description('Sort and organize music files')
    .version('1.0.0');
  
  setupCommands(program);
  
  await program.parseAsync(process.argv);
}

main().catch(error => {
  console.error('Error in main execution:', error);
  process.exit(1);
});
