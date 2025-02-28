import { execa } from 'execa';
import { DefaultRenderer, ListrTaskWrapper, SimpleRenderer } from 'listr2';

export async function installPackages(
  targetDirectory: string,
  task: ListrTaskWrapper<any, typeof DefaultRenderer, typeof SimpleRenderer>,
) {
  task.title = '📦 Installing dependencies with yarn, successfully installed!';
  await execa('yarn', ['install'], { cwd: targetDirectory });
  task.title = '📦 Install dependencies with yarn, successfully installed!';
}
