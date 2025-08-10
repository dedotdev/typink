import inquirer, { Answers } from 'inquirer';
import arg from 'arg';
import {
  BaseOptions,
  INK_VERSIONS_CHOICES,
  InkVersion,
  NETWORKS_FOR_PALLET_CONTRACTS,
  NETWORKS_FOR_PALLET_REVIVE,
  Options,
  PRESET_CONTRACTS_FOR_PALLET_CONTRACTS,
  PRESET_CONTRACTS_FOR_PALLET_REVIVE,
  TEMPLATES,
  WALLET_CONNECTORS,
} from '../types.js';
import validate from 'validate-npm-package-name';

const defaultOptions: BaseOptions = {
  projectName: 'my-typink-app',
  inkVersion: InkVersion.InkV6,
  template: 'default',
  presetContract: 'psp22',
  walletConnector: 'Default',
  // Because `Pop Testnet` support both pallet-contracts and pallet-revive, we use it as default network
  networks: ['Pop Testnet'],
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
      message: 'What ink version do you want to use?',
      choices: INK_VERSIONS_CHOICES,
      default: defaultOptions.inkVersion,
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
      name: 'walletConnector',
      message: 'What wallet connector do you want to use?',
      choices: WALLET_CONNECTORS,
      default: defaultOptions.walletConnector,
    },
    {
      type: 'list',
      name: 'presetContract',
      message: 'What example contract do you want to use?',
      choices: (answers: Answers) =>
        answers.inkVersion === InkVersion.InkV6
          ? PRESET_CONTRACTS_FOR_PALLET_REVIVE // prettier-ignore
          : PRESET_CONTRACTS_FOR_PALLET_CONTRACTS,
      default: defaultOptions.presetContract,
    },
    {
      type: 'checkbox',
      name: 'networks',
      message: 'What networks do you want to connect?',
      choices: (answers: Answers) =>
        answers.inkVersion === InkVersion.InkV6
          ? NETWORKS_FOR_PALLET_REVIVE // prettier-ignore
          : NETWORKS_FOR_PALLET_CONTRACTS,
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

      '--example': String,
      '-e': '--example',

      '--wallet': String,
      '-w': '--wallet',

      '--networks': [String],
      '-N': '--networks',

      '--ink-version': String,
      '-i': '--ink-version',

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

  if (args['--wallet'] && !WALLET_CONNECTORS.includes(args['--wallet'] as any)) {
    throw new Error(`Wallet connector ${args['--wallet']} is not supported. Please use a supported wallet connector.`);
  }

  if (args['--ink-version'] && !Object.values(InkVersion).includes(args['--ink-version'] as any)) {
    throw new Error(`Template ${args['--template']} is not supported. Please use a valid template.`);
  }

  let inkVersion = args['--ink-version'];

  // If args['networks'] or args['example'] is provided, we need inkVersion to determine if it supports the networks or examples
  // If inkVersion is not provided, we assume it is InkV6 (pallet-revive) by default
  if (args['--networks'] || args['--example']) {
    inkVersion = inkVersion || InkVersion.InkV6;
    const isInkPalletRevive = inkVersion === InkVersion.InkV6;

    if (
      args['--example'] &&
      (isInkPalletRevive
        ? !PRESET_CONTRACTS_FOR_PALLET_REVIVE.includes(args['--example'] as any)
        : !PRESET_CONTRACTS_FOR_PALLET_CONTRACTS.includes(args['--example'] as any))
    ) {
      throw new Error(
        `Preset contract ${args['--example']} is not supported for ink! ${inkVersion}. Please use a valid example contract.`,
      );
    }

    if (args['--networks']) {
      args['--networks'].forEach((network: string) => {
        if (
          isInkPalletRevive
            ? !NETWORKS_FOR_PALLET_REVIVE.includes(network as any)
            : !NETWORKS_FOR_PALLET_CONTRACTS.includes(network as any)
        ) {
          throw new Error(`Network ${network} is not !ink ${inkVersion} supported. Please use supported network.`);
        }
      });
    }
  }

  if (args['--template'] && !TEMPLATES.includes(args['--template'] as any)) {
    throw new Error(`Template ${args['--template']} is not supported. Please use a valid template.`);
  }

  return {
    projectName: args['--name'] || null,
    walletConnector: args['--wallet'] || null,
    inkVersion,
    presetContract: args['--example'] || null,
    // Because there is only `default` tepmlate, we use `default` as default value
    template: args['--template'] || 'default',
    networks: args['--networks'] || null,
    skipInstall: !!args['--skip-install'],
    noGit: !!args['--no-git'],
    help: args['--help'] || false,
  } as Options;
}
