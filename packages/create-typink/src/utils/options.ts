import inquirer, { Answers } from 'inquirer';
import arg from 'arg';
import {
  BaseOptions,
  INK_VERSIONS_CHOICES,
  InkVersion,
  LEGACY_NETWORKS,
  Options,
  TEMPLATES,
  UI,
  UI_CHOICES,
  V6_NETWORKS,
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
  networks: [],
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

        return `Project ${name} is not a valid package name with errors: ${result.errors?.join(', ')}.\\nPlease use a valid package name.`;
      },
    },
    {
      type: 'list',
      name: 'inkVersion',
      message: 'Which ink version do you want to use?',
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
      message: 'Which ui do you want to use?',
      choices: UI_CHOICES,
      default: defaultOptions.ui,
    },
    {
      type: 'checkbox',
      name: 'networks',
      message: 'Which networks do you want to support?',
      choices: (answers: Answers) =>
        answers.inkVersion === InkVersion.InkV6
          ? V6_NETWORKS // prettier-ignore
          : LEGACY_NETWORKS,
      default: defaultOptions.networks,
      validate: (networks: string[]) => {
        if (networks.length === 0) {
          return 'Please select at least one network.';
        }

        return true;
      },
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

      '--networks': [String],
      '-N': '--networks',

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

  if (args['--networks'] && args['--networks'].length > 0) {
    if (!inkVersion) {
      // TODO: Default to ink v6 if not provided?
      throw new Error(`If you provide networks, you must also provide a template to determine the ink version.`);
    } else {
      // If args['networks'] is provided, we check if it supports the networks or examples
      args['--networks'].forEach((network: string) => {
        if (
          inkVersion === InkVersion.InkV6
            ? !V6_NETWORKS.map((o) => o.name).includes(network as any)
            : !LEGACY_NETWORKS.map((o) => o.name).includes(network as any)
        ) {
          throw new Error(`Network ${network} is not !ink ${inkVersion} supported. Please use supported network.`);
        }
      });
    }
  }

  return {
    projectName: args['--name'] || null,
    inkVersion,
    walletConnector,
    ui,
    template: args['--template'] || null,
    networks:
      args['--networks'] ||
      // If no networks are provided, we default to the first network of the selected ink version
      (inkVersion === InkVersion.InkV6 ? [V6_NETWORKS.at(0)!.value] : [LEGACY_NETWORKS.at(0)!.value]) ||
      null,
    skipInstall: !!args['--skip-install'],
    noGit: !!args['--no-git'],
    help: args['--help'] || false,
  } as Options;
}
