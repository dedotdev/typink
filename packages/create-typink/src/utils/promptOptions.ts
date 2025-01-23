import inquirer from 'inquirer';
import { BaseOptions, Options, TEMPLATES, PRESET_CONTRACTS, WALLET_CONNECTORS, NETWORKS } from '../types.js';
import { IS_VALID_PACKAGE_NAME } from './string.js';

const defaultOptions: BaseOptions = {
  projectName: 'my-typink-app',
  template: 'base',
  presetContract: 'greeter',
  walletConnector: 'Default',
  network: 'Pop Testnet',
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
        const isValid = IS_VALID_PACKAGE_NAME.test(name);
        if (isValid) {
          return true;
        }

        return 'Project ' + name + ' is not a valid package name. Please use a valid package name.';
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
      name: 'network',
      message: 'What network do you want to connect?',
      choices: NETWORKS,
      default: defaultOptions.network,
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
