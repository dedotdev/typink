import inquirer from 'inquirer';
import arg from 'arg';
import { BaseOptions, Options, TEMPLATES } from '../types.js';
import validate from 'validate-npm-package-name';

const defaultOptions: BaseOptions = {
  projectName: 'my-typink-app',
  template: 'legacy-typink-vite',
  skipInstall: false,
  pkgManager: { name: 'npm' },
  noGit: false,
};

export async function promptMissingOptions(options: Options): Promise<Options> {
  const alreadyKnowAnswers = Object.fromEntries(Object.entries(options).filter(([, value]) => !!value));
  const questions = [
    {
      type: 'input',
      name: 'projectName',
      message: 'Your project name:',
      default: defaultOptions.projectName,
      validate: (name: string) => {
        const result = validate(name);
        if (result.validForNewPackages) {
          return true;
        }

        return `Project ${name} is not a valid package name with errors: ${result.errors?.join(', ')}.\nPlease use a valid package name.`;
      },
    },
    {
      type: 'list',
      name: 'template',
      message: 'Which template do you want to use? (format: {inkVersion}-{wallet}-{ui})',
      choices: TEMPLATES,
      default: defaultOptions.template,
    },
  ];

  // @ts-ignore
  const answers = await inquirer.prompt(questions, alreadyKnowAnswers);

  return {
    ...defaultOptions,
    ...options,
    ...answers,
  };
}

export function parseArguments(): Options {
  const args = arg(
    {
      '--name': String,
      '-n': '--name',

      '--template': String,
      '-t': '--template',

      '--no-git': Boolean,

      '--skip-install': Boolean,
      '--skip': '--skip-install',

      '--help': Boolean,
      '-h': '--help',

      '--version': Boolean,
      '-v': '--version',
    },
    {
      argv: process.argv.slice(2),
    },
  );

  if (args['--name']) {
    const result = validate(args['--name']);

    if (!result.validForNewPackages) {
      throw new Error(
        `Project ${args['--name']} is not a valid package name with errors: ${result.errors?.join(', ')}.\nPlease use a valid package name.`,
      );
    }
  }

  if (args['--template'] && !TEMPLATES.includes(args['--template'] as any)) {
    throw new Error(`Template ${args['--template']} is not supported. Please use a valid template.`);
  }

  return {
    projectName: args['--name'] || null,
    template: args['--template'] || null,
    skipInstall: !!args['--skip-install'],
    noGit: !!args['--no-git'],
    help: args['--help'] || false,
    version: args['--version'] || false,
  } as Options;
}
