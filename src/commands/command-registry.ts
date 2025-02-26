// src/commands/command-registry.ts
import { Command } from 'commander';
import { sortCommand } from './sort-command';
import { undoCommand } from './undo-command';
import { serverCommand } from './server-command';
// Uncomment when implemented
// import { renameCommand } from './rename-command';

export function setupCommands(program: Command): void {
  sortCommand(program);
  undoCommand(program);
  serverCommand(program);
  // Uncomment when implemented
  // renameCommand(program);
}
