import chalk from 'chalk';
import {
  parseArguments,
  pkgFromUserAgent,
  promptMissingOptions,
  renderHelpMessage,
  renderIntroArt,
  renderOutroMessage,
} from './utils/index.js';
import { createProject } from './createProject.js';
import { fileURLToPath } from 'url';

export async function createTypink() {
  try {
    renderIntroArt();

    const args = parseArguments();

    if (args.help) {
      renderHelpMessage();
      return;
    }

    const pkgManager = pkgFromUserAgent(process.env.npm_config_user_agent);
    const options = await promptMissingOptions(args);
    if (pkgManager) {
      options.pkgManager = pkgManager;
    }

    await createProject(options);

    renderOutroMessage(options);
  } catch (error) {
    console.error(chalk.red.bold('🚨 An error occurred:'), error);
    console.error(chalk.red.bold('🚨 Sorry, exiting...'));
  }
}

// run directly from root folder: tsx ./packages/create-typink/src/index.ts
const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) {
  createTypink().catch(console.error);
}
