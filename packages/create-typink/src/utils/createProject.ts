import { Options } from '../types.js';
import { Listr } from 'listr2';
import { fileURLToPath } from 'url';
import * as path from 'path';
import chalk from 'chalk';
import { createFirstCommit, installPackages, createProjectDirectory, copyTemplateFiles } from '../tasks/index.js';

export async function createProject(options: Options) {
  const { projectName, skipInstall, noGit } = options;

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const templateDirectory = path.resolve(__dirname, '../../templates');
  const targetDirectory = path.resolve(process.cwd(), projectName!);

  const tasks = new Listr(
    [
      {
        title: `📁 Create project directory ${targetDirectory}`,
        task: () => createProjectDirectory(projectName!),
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
        skip: skipInstall,
      },
      {
        title: `🚨 Create the very first Git commit`,
        task: () => createFirstCommit(targetDirectory),
        skip: noGit,
      },
    ],
    { rendererOptions: { suffixSkips: true }, exitOnError: true },
  );

  await tasks.run();
}
