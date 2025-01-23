import chalk from 'chalk';
import {
  parseArguments,
  renderIntroArt,
  createProject,
  promptMissingOptions,
  renderHelpMessage,
  renderOutroMessage,
} from './utils/index.js';

export async function createTypink() {
  try {
    renderIntroArt();

    const args = parseArguments();

    if (args.help) {
      renderHelpMessage();
      return;
    }

    const options = await promptMissingOptions(args);

    await createProject(options);

    renderOutroMessage(options);
  } catch (error) {
    console.error(chalk.red.bold('🚨 An error occurred:'), error);
    console.error(chalk.red.bold('🚨 Sorry, exiting...'));
  }
}
