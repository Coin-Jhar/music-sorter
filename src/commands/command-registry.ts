// src/commands/command-registry.ts
import { Command } from 'commander';
import { sortCommand } from './sort-command';
import { undoCommand } from './undo-command';
import { serverCommand } from './server-command';
import { renameCommand } from './rename-command';
import { settingsCommand } from './settings-command';

export function setupCommands(program: Command): void {
  // Register all commands
  sortCommand(program);
  undoCommand(program);
  serverCommand(program);
  renameCommand(program);
  settingsCommand(program);
}
