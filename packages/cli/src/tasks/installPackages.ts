import { execa } from 'execa';

export async function installPackages(targetDirectory: string) {
  await execa('yarn', ['install'], { cwd: targetDirectory });
}
