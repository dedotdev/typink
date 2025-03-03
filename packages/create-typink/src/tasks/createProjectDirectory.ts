import { execa } from 'execa';
import { DefaultRenderer, ListrTaskWrapper, SimpleRenderer } from 'listr2';
import chalk from 'chalk';

export async function createProjectDirectory(
  projectName: string,
  task: ListrTaskWrapper<any, typeof DefaultRenderer, typeof SimpleRenderer>,
) {
  task.title = `📁 Creating project directory: ${chalk.green.bold(projectName)}`;

  try {
    const result = await execa('mkdir', [projectName]);

    if (result.failed) {
      throw new Error(`There was an error when running mkdir command`);
    }

    task.title = `📁 Created project directory: ${chalk.green.bold(projectName)}`;
  } catch (error: any) {
    throw new Error(`Failed to create project directory: ${projectName} with error: ${error.message}`);
  }
}
