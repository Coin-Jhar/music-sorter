// src/commands/server-command.ts
import { Command } from 'commander';
import { startServer } from '../server/server';
import { logger } from '../utils/logger';

export function serverCommand(program: Command): void {
  program
    .command('server')
    .description('Start the web server interface')
    .option('-p, --port <port>', 'Port to run the server on', '3000')
    .action(async (options) => {
      const port = parseInt(options.port, 10);
      
      logger.info(`Starting web server on port ${port}...`);
      
      try {
        await startServer(port);
        logger.success(`Server running at http://localhost:${port}`);
        logger.info('Press Ctrl+C to stop the server');
      } catch (error) {
        logger.error('Error starting server:', error as Error);
      }
    });
}
