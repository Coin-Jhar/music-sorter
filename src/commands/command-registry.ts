// src/commands/command-registry.ts
import { Command } from 'commander';
import { sortCommand } from './sort-command';
import { undoCommand } from './undo-command';
// import { renameCommand } from './rename-command'; // Will add later

export function setupCommands(program: Command): void {
  sortCommand(program);
  undoCommand(program);
  // renameCommand(program); // Will add later
}

// Update src/index.ts
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
