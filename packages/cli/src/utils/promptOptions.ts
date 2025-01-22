import inquirer from 'inquirer';
import { BaseOptions, PresetContract } from '../types.js';

export const IS_VALID_PACKAGE_NAME = /^(?![._])(?!(http|stream|node_modules|favicon\.ico)$)[a-z0-9-]{1,214}$/;

const defaultOptions: BaseOptions = {
  projectName: 'my-typink-app',
  installPackage: true,
  presetContract: 'base',
};

export async function promptOptions(): Promise<BaseOptions> {
  const questions = [
    {
      type: 'input',
      name: 'projectName',
      message: 'Your project name (my-typink-app):',
      default: defaultOptions.projectName,
      validate: (name: string) => {
        const isValid = IS_VALID_PACKAGE_NAME.test(name);
        if (isValid) {
          return true;
        }

        return 'Project ' + name + ' is not a valid package name. Please use a valid package name.';
      },
    },
    {
      type: 'list',
      name: 'presetContract',
      message: 'What preset contract do you want to use?',
      choices: ['none', 'base', 'psp22', 'greeter'] as PresetContract[],
      default: 'base' as PresetContract,
    },
  ];

  // @ts-ignore
  const answers = await inquirer.prompt(questions);

  return {
    ...defaultOptions,
    ...answers,
  };
}
