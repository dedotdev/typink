import { Options } from './types.js';
import { Listr } from 'listr2';
import { fileURLToPath } from 'url';
import * as path from 'path';
import chalk from 'chalk';
import { createProjectDirectory, createFirstCommit, copyTemplateFiles, prettierFormat, installPackages } from './tasks/index.js';

export async function createProject(options: Options) {
  const { projectName, skipInstall, noGit } = options;


  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  // Kept for backward signature compatibility; not used anymore
  const templateDirectory = path.resolve(__dirname, './templates');
  const targetDirectory = path.resolve(process.cwd(), projectName!);

  const tasks = new Listr(
    [
      {
        title: `📁 Create project directory: ${chalk.green.bold(targetDirectory)}`,
        task: (_, task) => createProjectDirectory(projectName!, task),
      },
      {
        title: `🚀 Initialize new Typink dApp`,
        task: (_, task) => copyTemplateFiles(options, templateDirectory, targetDirectory, task),
      },
      {
        title: `📦 Install dependencies with ${chalk.green.bold(options.pkgManager.name)}`,
        task: (_, task) => installPackages(options, targetDirectory, task),
        skip: skipInstall,
      },
      {
        title: '🎨 Prettify the codebase',
        task: (_, task) => prettierFormat(targetDirectory, options, task),
      },
      {
        title: `🚨 Create the very first Git commit`,
        task: (_, task) => createFirstCommit(targetDirectory, task),
        skip: noGit,
      },
    ],
    { rendererOptions: { suffixSkips: true }, exitOnError: true },
  );

  await tasks.run();
}
