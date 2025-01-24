import { execa } from 'execa';
import { Options } from '../types.js';
import * as fs from 'fs';
import * as ejs from 'ejs';
import * as path from 'path';
import { stringCamelCase } from '@dedot/utils';
import { IS_IGNORE_FILES, IS_TEMPLATE_FILE } from '../utils/index.js';

export async function copyTemplateFiles(options: Options, templatesDir: string, targetDir: string) {
  const { projectName, noGit, template } = options;

  const templateDir = `${templatesDir}/${template}`;

  if (!fs.existsSync(templateDir)) {
    throw new Error(`Preset directory not found: ${templateDir}`);
  }

  fs.cpSync(templateDir, targetDir, { recursive: true });

  const packageJsonPath = `${targetDir}/package.json`;
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

  packageJson.name = projectName;

  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

  processTemplate(options, targetDir);

  if (!noGit) {
    await execa('git', ['init'], { cwd: targetDir });
    await execa('git', ['checkout', '-b', 'main'], { cwd: targetDir });
  }
}

export async function processTemplate(rawOptions: Options, targetDir: string) {
  const options = {
    ...rawOptions,
    networks: rawOptions.networks?.map(stringCamelCase),
  };

  await _processTemplate(options, targetDir);
}

export async function _processTemplate(options: any, dir: string) {
  if (IS_IGNORE_FILES.test(dir)) {
    return;
  }

  const files = await fs.promises.readdir(dir, { withFileTypes: true });

  for (const file of files) {
    const filePath = path.join(dir, file.name);

    if (file.isDirectory()) {
      await _processTemplate(options, filePath);
    } else {
      if (IS_TEMPLATE_FILE.test(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        const result = ejs.render(content, { options });

        await fs.promises.writeFile(filePath.replace('.template.ejs', ''), result);
        await fs.promises.rm(filePath);
      }
    }
  }
}
