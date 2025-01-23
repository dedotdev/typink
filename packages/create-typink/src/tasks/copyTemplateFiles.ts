import { execa } from 'execa';
import { Options } from '../types.js';
import * as fs from 'fs';

export async function copyTemplateFiles(options: Options, templatesDir: string, targetDir: string) {
  const { projectName, presetContract, noGit, template } = options;

  // Currently, just support `base` preset
  const templateDir = `${templatesDir}/${template}`;

  if (!fs.existsSync(templateDir)) {
    throw new Error(`Preset directory not found: ${templateDir}`);
  }

  fs.cpSync(templateDir, targetDir, { recursive: true });

  const packageJsonPath = `${targetDir}/package.json`;
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

  packageJson.name = projectName;

  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

  if (!noGit) {
    await execa('git', ['init'], { cwd: targetDir });
    await execa('git', ['checkout', '-b', 'main'], { cwd: targetDir });
  }
}
