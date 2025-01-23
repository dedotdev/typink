import chalk from 'chalk';
import { Options } from '../types.js';

export const INTRO_ART = `
░█▀▀░█▀▄░█▀▀░█▀█░▀█▀░█▀▀░░░░░▀█▀░█░█░█▀█░▀█▀░█▀█░█░█
░█░░░█▀▄░█▀▀░█▀█░░█░░█▀▀░▄▄▄░░█░░░█░░█▀▀░░█░░█░█░█▀▄
░▀▀▀░▀░▀░▀▀▀░▀░▀░░▀░░▀▀▀░░░░░░▀░░░▀░░▀░░░▀▀▀░▀░▀░▀░▀
`;

export function renderIntroArt() {
  console.log(INTRO_ART);
}

export function renderHelpMessage() {
  console.log(` ${chalk.bold.blue('Usage:')}
    ${chalk.bold.green('npx create-typink<@version>')} ${chalk.gray('[--skip | --skip-install] [-n <project-name> | --name <project-name>] [-t <template-name> | --template <template-name>] [-p <preset-contract> | --preset <preset-contract>] [-w <wallet-connector> | --wallet <wallet-connector>] [-N <network-name> | --network <network-name>] [--no-git] [-v | --version] [-h | --help]')}
`);
  console.log(` ${chalk.bold.blue('Options:')}
    ${chalk.gray('-n, --name')}                       Project name
    ${chalk.gray('-t, --template')}                   Template <base>
    ${chalk.gray('-p, --preset')}                     Preset contract <base|psp22|greeter|none>
    ${chalk.gray('-w, --wallet')}                     Wallet connector <Default|Subconnect|Talisman Connect>
    ${chalk.gray('-N, --network')}                    Network <Pop Testnet|Aleph Zero Testnet|Aleph Zero Mainnet|Astar|Shiden|Shibuya>
    ${chalk.gray('--skip, --skip-install')}           Skip packages installation
    ${chalk.gray('--no-git')}                         Skip git initialization
    ${chalk.gray('-v, --version')}                    Show Typink version
    ${chalk.gray('-h, --help')}                       Show help
    `);
}

export function renderOutroMessage(options: Options) {
  if (options.skipInstall) {
    console.log(`\n${chalk.bold.green('🎉 Your project is ready!')}
${chalk.bold.blue('➡️ To get started:')}
    ${chalk.bold.blue(`$ cd ${options.projectName}`)}
    ${chalk.bold.blue('$ yarn install')}
    ${chalk.bold.blue('$ yarn start')}
`);
  } else {
    console.log(`\n${chalk.bold.green('🎉 Your project is ready!')}
${chalk.bold.blue('➡️ To get started:')}
    ${chalk.bold.blue(`$ cd ${options.projectName}`)}
    ${chalk.bold.blue('$ yarn start')}
`);
  }
}
