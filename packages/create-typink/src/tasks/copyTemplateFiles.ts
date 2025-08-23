import { execa } from 'execa';
import { Options } from '../types.js';
import * as fs from 'fs';
import * as path from 'path';
import os from 'os';
import { DefaultRenderer, ListrTaskWrapper, SimpleRenderer } from 'listr2';

// Download the template folder from the GitHub repo and set up the project
export async function copyTemplateFiles(
  options: Options,
  _templatesDir: string, // no longer used; templates are fetched remotely
  targetDir: string,
  task: ListrTaskWrapper<any, typeof DefaultRenderer, typeof SimpleRenderer>,
) {
  const { projectName, noGit, template } = options;
  task.title = `🚀 Initializing new Typink dApp`;

  // Repo to pull templates from, can be overridden by env
  const repoUrl = process.env.TYPINK_TEMPLATE_REPO || 'https://github.com/dedotdev/typink.git';
  const repoBranch = process.env.TYPINK_TEMPLATE_BRANCH || 'main';

  const tmpRoot = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'create-typink-'));
  const cloneDir = path.join(tmpRoot, 'repo');

  await execa('git', ['clone', '--depth', '1', '--branch', repoBranch, repoUrl, cloneDir]);

  const templatePathInRepo = path.join(cloneDir, 'packages', 'create-typink', 'templates', template!);
  if (!fs.existsSync(templatePathInRepo)) {
    throw new Error(`Template not found in repo: ${template}`);
  }

  await fs.promises.cp(templatePathInRepo, targetDir, { recursive: true });

  // Ensure .gitignore exists if template used 'gitignore'
  const gitIgnore = path.join(targetDir, 'gitignore');
  if (fs.existsSync(gitIgnore)) {
    await fs.promises.rename(gitIgnore, path.join(targetDir, '.gitignore'));
  }

  // Set package name
  const packageJsonPath = path.join(targetDir, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    packageJson.name = projectName;
    await fs.promises.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
  }

  // Initialize git if requested
  if (!noGit) {
    await execa('git', ['init'], { cwd: targetDir });
    await execa('git', ['checkout', '-b', 'main'], { cwd: targetDir });
  }

  task.title = `🚀 Initialized new Typink dApp`;
}
