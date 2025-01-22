import { createProjectDirectory } from '../tasks/createProjectDirectory.js';
import { BaseOptions } from '../types.js';
import { Listr } from 'listr2';
import { fileURLToPath } from 'url';
import * as path from 'path';
import chalk from 'chalk';
import { copyTemplateFiles } from '../tasks/copyTemplateFiles.js';
import { installPackages } from '../tasks/installPackages.js';
import { createFirstCommit } from '../tasks/createFirstCommit.js';

export async function createProject(options: BaseOptions) {
  const { projectName } = options;

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const templateDirectory = path.resolve(__dirname, '../../templates');
  const targetDirectory = path.resolve(process.cwd(), projectName);

  const tasks = new Listr(
    [
      {
        title: `📁 Create project directory ${targetDirectory}`,
        task: () => createProjectDirectory(projectName),
      },
      {
        title: `🚀 Creating a new Typink app in ${chalk.green.bold(projectName)}`,
        task: () => copyTemplateFiles(options, templateDirectory, targetDirectory),
      },
      {
        title: '📦 Installing dependencies with yarn, this could take a while',
        task: () => installPackages(targetDirectory),
        rendererOptions: {
          outputBar: 8,
          persistentOutput: false,
        },
      },
      {
        title: `📡 Create the very first Git commit`,
        task: () => createFirstCommit(targetDirectory),
      },
    ],
    { rendererOptions: { collapseSkips: false, suffixSkips: true }, exitOnError: true },
  );

  await tasks.run();
}
