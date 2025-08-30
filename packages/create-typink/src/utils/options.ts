import inquirer from 'inquirer';
import arg from 'arg';
import {
  BaseOptions,
  INK_VERSIONS_CHOICES,
  InkVersion,
  Options,
  TEMPLATES,
  UI,
  UI_CHOICES,
  WALLET_CONNECTORS_CHOICES,
  WalletConnector,
} from '../types.js';
import validate from 'validate-npm-package-name';

const defaultOptions: BaseOptions = {
  projectName: 'my-typink-app',
  inkVersion: InkVersion.InkV6,
  walletConnector: WalletConnector.Typink,
  ui: UI.Vite,
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
      name: 'inkVersion',
      message: 'Which ink! version do you want to use?',
      choices: INK_VERSIONS_CHOICES,
      default: defaultOptions.inkVersion,
    },
    {
      type: 'list',
      name: 'walletConnector',
      message: 'Which wallet connector do you want to use?',
      choices: WALLET_CONNECTORS_CHOICES,
      default: defaultOptions.walletConnector,
    },
    {
      type: 'list',
      name: 'ui',
      message: 'Which UI template do you want to use?',
      choices: UI_CHOICES,
      default: defaultOptions.ui,
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

  const [inkVersion, walletConnector, ui] = args['--template']
    ? (args['--template'] as string).split('-')
    : [null, null, null];

  return {
    projectName: args['--name'] || null,
    inkVersion,
    walletConnector,
    ui,
    template: args['--template'] || null,
    skipInstall: !!args['--skip-install'],
    noGit: !!args['--no-git'],
    help: args['--help'] || false,
  } as Options;
}
