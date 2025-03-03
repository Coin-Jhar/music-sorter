// src/commands/command-registry.ts
import { Command } from 'commander';
import { sortCommand } from './sort-command';
import { undoCommand } from './undo-command';
import { serverCommand } from './server-command';
import { renameCommand } from './rename-command';
import { settingsCommand } from './settings-command';
import { helpCommand } from './help-command';
import { analyzeCommand } from './analyze-command';
import { debugCommand } from './debug-command';

export function setupCommands(program: Command): void {
  // Register all commands
  sortCommand(program);
  renameCommand(program);
  analyzeCommand(program);
  undoCommand(program);
  serverCommand(program);
  settingsCommand(program);
  helpCommand(program);
  debugCommand(program);
}
