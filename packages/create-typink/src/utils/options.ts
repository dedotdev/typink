import inquirer, { Answers } from 'inquirer';
import arg from 'arg';
import {
  BaseOptions,
  CONTRACT_TYPES_CHOICES,
  ContractType,
  Options,
  PALLET_CONTRACTS_NETWORKS,
  PALLET_REVIVE_NETWORKS,
  TEMPLATES,
} from '../types.js';
import validate from 'validate-npm-package-name';

const defaultOptions: BaseOptions = {
  projectName: 'my-typink-app',
  contractType: ContractType.InkV6,
  template: 'inkv6-nextjs',
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
      message: 'Project name:',
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
      message: 'Select contract type:',
      choices: CONTRACT_TYPES_CHOICES,
      default: defaultOptions.contractType,
    },
    {
      type: 'checkbox',
      name: 'networks',
      message: 'Select supported networks:',
      choices: (answers: Answers) =>
        answers.contractType === ContractType.InkV5
          ? PALLET_CONTRACTS_NETWORKS.map(( {name, value}) => ({name, value})) // prettier-ignore
          : PALLET_REVIVE_NETWORKS.map(({ name, value }) => ({ name, value })),
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

  const contractType = args['--template'];
  if (contractType && !TEMPLATES.includes(contractType as any)) {
    throw new Error(`Template "${contractType}" is not available.`);
  }

  if (args['--networks'] && args['--networks'].length > 0) {
    // If args['networks'] is provided, we check if it supports the networks or examples
    args['--networks'].forEach((network: string) => {
      if (
        contractType === ContractType.InkV5
          ? !PALLET_CONTRACTS_NETWORKS.map((o) => o.name).includes(network as any)
          : !PALLET_REVIVE_NETWORKS.map((o) => o.name).includes(network as any)
      ) {
        throw new Error(`Network ${network} is not supported for template: ${contractType}.`);
      }
    });
  }

  return {
    projectName: args['--name'] || null,
    contractType: contractType?.replace('-nextjs', ''),
    template: args['--template'] || null,
    networks: args['--networks'] || null,
    skipInstall: !!args['--skip-install'],
    noGit: !!args['--no-git'],
    help: args['--help'] || false,
  } as Options;
}
