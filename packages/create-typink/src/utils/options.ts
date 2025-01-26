import inquirer from 'inquirer';
import arg from 'arg';
import { BaseOptions, Options, TEMPLATES, PRESET_CONTRACTS, WALLET_CONNECTORS, NETWORKS } from '../types.js';
import validate from 'validate-npm-package-name';

const defaultOptions: BaseOptions = {
  projectName: 'my-typink-app',
  template: 'default',
  presetContract: 'greeter',
  walletConnector: 'Default',
  networks: ['Pop Testnet'],
  skipInstall: false,
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
      message: 'Which template do you want to use?',
      choices: TEMPLATES,
      default: defaultOptions.template,
    },
    {
      type: 'list',
      name: 'presetContract',
      message: 'What preset contract do you want to use?',
      choices: PRESET_CONTRACTS,
      default: defaultOptions.presetContract,
    },
    {
      type: 'list',
      name: 'walletConnector',
      message: 'What wallet connector do you want to use?',
      choices: WALLET_CONNECTORS,
      default: defaultOptions.walletConnector,
    },
    {
      type: 'checkbox',
      name: 'networks',
      message: 'What networks do you want to connect?',
      choices: NETWORKS,
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

      '--preset': String,
      '-p': '--preset',

      '--wallet': String,
      '-w': '--wallet',

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

  if (args['--preset'] && !PRESET_CONTRACTS.includes(args['--preset'] as any)) {
    throw new Error(`Preset contract ${args['--preset']} is not supported. Please use a valid preset contract.`);
  }

  if (args['--wallet'] && !WALLET_CONNECTORS.includes(args['--wallet'] as any)) {
    throw new Error(`Wallet connector ${args['--wallet']} is not supported. Please use a supported wallet connector.`);
  }

  if (args['--networks']) {
    args['--networks'].forEach((network: string) => {
      if (!NETWORKS.includes(network as any)) {
        throw new Error(`Network ${network} is not supported. Please use supported network.`);
      }
    });
  }

  if (args['--template'] && !TEMPLATES.includes(args['--template'] as any)) {
    throw new Error(`Template ${args['--template']} is not supported. Please use a valid template.`);
  }

  return {
    projectName: args['--name'] || null,
    presetContract: args['--preset'] || null,
    walletConnector: args['--wallet'] || null,
    // Because there is only `default` tepmlate, we use `default` as default value
    template: args['--template'] || 'default',
    networks: args['--networks'] || null,
    skipInstall: !!args['--skip-install'],
    noGit: !!args['--no-git'],
    help: args['--help'] || false,
  } as Options;
}
