import { setupCLI } from './cli/commands';

async function main() {
  const program = setupCLI();
  await program.parseAsync(process.argv);
}

main().catch(error => {
  console.error('Error in main execution:', error);
  process.exit(1);
});
