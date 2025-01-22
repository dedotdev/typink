import { execa } from 'execa';
import { BaseOptions } from '../types.js';
import * as fs from 'fs';

export async function copyTemplateFiles(options: BaseOptions, templateDir: string, targetDir: string) {
  const { projectName, presetContract } = options;

  // Currently, just support `base` preset
  const presetDir = `${templateDir}/${presetContract}`;

  if (!fs.existsSync(presetDir)) {
    throw new Error(`Preset directory not found: ${presetDir}`);
  }

  // 1. Copy all files from the template directory to the target directory
  fs.cpSync(presetDir, targetDir, { recursive: true });

  // 2. Rename project name with options
  const packageJsonPath = `${targetDir}/package.json`;
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

  packageJson.name = projectName;

  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

  // 3. Git init in the target directory
  await execa('git', ['init'], { cwd: targetDir });
  await execa('git', ['checkout', '-b', 'main'], { cwd: targetDir });
}
