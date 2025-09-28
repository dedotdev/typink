import inquirer, { Answers } from 'inquirer';
import arg from 'arg';
import {
  BaseOptions,
  CONTRACT_TYPES_CHOICES,
  ContractType,
  PALLET_CONTRACTS_NETWORKS,
  Options,
  TEMPLATES,
  PALLET_REVIVE_NETWORKS,
} from '../types.js';
import validate from 'validate-npm-package-name';
import { stringCamelCase } from '@dedot/utils';

const defaultOptions: BaseOptions = {
  projectName: 'my-typink-app',
  contractType: ContractType.InkV6,
  template: 'inkv6-nextjs',
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

        return `Project ${name} is not a valid package name with errors: ${result.errors?.join(', ')}.\nPlease use a valid package name.`;
      },
    },
    {
      type: 'list',
      name: 'contractType',
      message: 'What contract type to use?',
      choices: CONTRACT_TYPES_CHOICES,
      default: defaultOptions.contractType,
    },
    {
      type: 'checkbox',
      name: 'networks',
      message: 'Which networks do you want to support?',
      choices: (answers: Answers) =>
        answers.contractType === ContractType.InkV5
          ? PALLET_CONTRACTS_NETWORKS // prettier-ignore
          : PALLET_REVIVE_NETWORKS,
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

  const [contractType, walletConnector, ui] = args['--template']
    ? (args['--template'] as string).split('-')
    : [null, null, null];

  if (args['--networks'] && args['--networks'].length > 0) {
    if (!contractType) {
      throw new Error(`If you provide networks, you must also provide a template to determine the ink version.`);
    } else {
      // If args['networks'] is provided, we check if it supports the networks or examples
      args['--networks'].forEach((network: string) => {
        if (
          contractType === ContractType.InkV5
            ? !PALLET_CONTRACTS_NETWORKS.map((o) => o.value).includes(stringCamelCase(network) as any)
            : !PALLET_REVIVE_NETWORKS.map((o) => o.value).includes(stringCamelCase(network) as any)
        ) {
          throw new Error(`Network ${network} is not ink! ${contractType} supported. Please use supported network.`);
        }
      });
    }
  }

  return {
    projectName: args['--name'] || null,
    contractType,
    template: args['--template'] || null,
    networks: args['--networks'] || null,
    skipInstall: !!args['--skip-install'],
    noGit: !!args['--no-git'],
    help: args['--help'] || false,
  } as Options;
}
