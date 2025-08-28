import { execa } from 'execa';
import { Options } from '../types.js';
import * as fs from 'fs';
import * as path from 'path';
import { DefaultRenderer, ListrTaskWrapper, SimpleRenderer } from 'listr2';
import { downloadTemplate } from 'giget';

export async function copyTemplateFiles(
  options: Options,
  targetDir: string,
  task: ListrTaskWrapper<any, typeof DefaultRenderer, typeof SimpleRenderer>,
) {
  const { projectName, noGit, inkVersion, walletConnector, ui } = options;
  const template = `${inkVersion}-${walletConnector}-${ui}`;

  task.title = `🚀 Initializing new Typink dApp`;

  // Repo to pull templates from, can be overridden by env
  const repoUrl = process.env.TYPINK_TEMPLATE_REPO || 'https://github.com/dedotdev/typink.git';
  const repoBranch = process.env.TYPINK_TEMPLATE_BRANCH || 'main';

  try {
    const ghMatch = /github\.com[/:]([^/]+)\/([^/.]+)(?:\.git)?/i.exec(repoUrl);
    if (ghMatch && template) {
      const owner = ghMatch[1];
      const repo = ghMatch[2];
      const baseSpec = `github:${owner}/${repo}/packages/create-typink/templates/${ui}#${repoBranch}`;
      const spec = `github:${owner}/${repo}/packages/create-typink/templates/${template}#${repoBranch}`;

      // Download template directly into the project directory
      await downloadTemplate(baseSpec, { dir: targetDir, force: true, preferOffline: true });
      await downloadTemplate(spec, { dir: targetDir, force: true, preferOffline: true });
    }
  } catch (e) {
    throw new Error(
      `[create-typink] giget download failed, falling back to git clone. Reason: ${(e as Error).message}`,
    );
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
