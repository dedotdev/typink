import arg from 'arg';
import { NETWORKS, Options, PRESET_CONTRACTS, WALLET_CONNECTORS } from '../types.js';
import { IS_VALID_PACKAGE_NAME } from './string.js';

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

      '--network': [String],
      '-N': '--network',

      '--no-git': Boolean,

      '--skip-install': Boolean,
      '--skip': '--skip-install',

      '--version': Boolean,
      '-v': '--version',

      '--help': Boolean,
      '-h': '--help',
    },
    {
      argv: process.argv.slice(2),
    },
  );

  if (args['--name'] && IS_VALID_PACKAGE_NAME.test(args['--name']) === false) {
    throw new Error('Project ' + args['--name'] + ' is not a valid package name. Please use a valid package name.');
  }

  if (args['--preset'] && !PRESET_CONTRACTS.includes(args['--preset'] as any)) {
    throw new Error('Preset contract ' + args['--preset'] + ' is not supported. Please use a valid preset contract.');
  }

  if (args['--wallet'] && !WALLET_CONNECTORS.includes(args['--wallet'] as any)) {
    throw new Error(
      'Wallet connector ' + args['--wallet'] + ' is not supported. Please use a supported wallet connector.',
    );
  }

  if (args['--network']) {
    args['--network'].forEach((network: string) => {
      if (!NETWORKS.includes(network as any)) {
        throw new Error('Network ' + network + ' is not supported. Please use supported network.');
      }
    });
  }

  return {
    projectName: args['--name'] || null,
    presetContract: args['--preset'] || null,
    walletConnector: args['--wallet'] || null,
    network: args['--network'] || null,
    skipInstall: !!args['--skip-install'],
    noGit: !!args['--no-git'],
    version: args['--version'] || false,
    help: args['--help'] || false,
  } as Options;
}
