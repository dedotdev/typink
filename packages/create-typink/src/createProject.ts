import { Options } from './types.js';
import { Listr } from 'listr2';
import { fileURLToPath } from 'url';
import * as path from 'path';
import chalk from 'chalk';
import {
  createProjectDirectory,
  createFirstCommit,
  copyTemplateFiles,
  prettierFormat,
  installPackages,
} from './tasks/index.js';

export async function createProject(options: Options) {
  const { projectName, skipInstall, noGit } = options;

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const templateDirectory = path.resolve(__dirname, './templates');
  const targetDirectory = path.resolve(process.cwd(), projectName!);

  const tasks = new Listr(
    [
      {
        title: `📁 Create project directory ${targetDirectory}`,
        task: (_, task) => createProjectDirectory(projectName!, task),
      },
      {
        title: `🚀 Create a new Typink app in ${chalk.green.bold(projectName)}`,
        task: (_, task) => copyTemplateFiles(options, templateDirectory, targetDirectory, task),
      },
      {
        title: '📦 Install dependencies with yarn',
        task: (_, task) => installPackages(targetDirectory, task),
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
