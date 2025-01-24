import * as prettier from 'prettier';
import * as path from 'path';
import { promises as fs } from 'fs';
import { Options } from '../types.js';
import { execa } from 'execa';

export async function prettierFormat(targetDir: string, options: Options) {
  if (!options.skipInstall) {
    await execa('yarn', ['prettify'], { cwd: targetDir });
  } else {
    const prettierConfig = await prettier.resolveConfig(path.resolve(targetDir, './.prettierrc.js'));

    await prettierFormatRecursive(targetDir, prettierConfig);
  }
}

async function prettierFormatRecursive(dir: string, config: prettier.Options | null) {
  const files = await fs.readdir(dir, { withFileTypes: true });

  for (const file of files) {
    const filePath = path.join(dir, file.name);

    if (file.isDirectory()) {
      await prettierFormatRecursive(filePath, config);
    } else {
      const fileInfo = await prettier.getFileInfo(filePath);

      if (fileInfo.ignored || !fileInfo.inferredParser) {
        continue;
      }

      const content = await fs.readFile(filePath, 'utf-8');
      const formatted = await prettier.format(content, {
        filepath: filePath,
        ...config,
      });

      await fs.writeFile(filePath, formatted, 'utf-8');
    }
  }
}
