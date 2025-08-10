import { execa } from 'execa';
import { DefaultRenderer, ListrTaskWrapper, SimpleRenderer } from 'listr2';
import { Options } from '../types.js';
import chalk from 'chalk';

export async function installPackages(
  options: Options,
  targetDirectory: string,
  task: ListrTaskWrapper<any, typeof DefaultRenderer, typeof SimpleRenderer>,
) {
  const { pkgManager } = options;

  task.title = `📦 Installing dependencies with ${chalk.green.bold(options.pkgManager.name)}, this could take a while`;
  await execa(pkgManager.name, ['install'], { cwd: targetDirectory });
  task.title = `📦 Installed dependencies with ${chalk.green.bold(options.pkgManager.name)} successfully!`;
}
