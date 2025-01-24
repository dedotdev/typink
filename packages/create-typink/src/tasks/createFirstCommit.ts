import { execa } from 'execa';

export async function createFirstCommit(targetDirectory: string) {
  await execa('git', ['add', '.'], { cwd: targetDirectory });
  await execa('git', ['commit', '-m', 'Initial commit 🚀'], {
    cwd: targetDirectory,
  });
}
