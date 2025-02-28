import { execa } from 'execa';
import { DefaultRenderer, ListrTaskWrapper, SimpleRenderer } from 'listr2';

export async function createFirstCommit(
  targetDirectory: string,
  task: ListrTaskWrapper<any, typeof DefaultRenderer, typeof SimpleRenderer>,
) {
  task.title = `🚨 Creating the very first Git commit`;

  await execa('git', ['add', '.'], { cwd: targetDirectory });
  await execa('git', ['commit', '-m', 'Initial commit 🚀'], {
    cwd: targetDirectory,
  });

  task.title = `🚨 Create the very first Git commit`;
}
