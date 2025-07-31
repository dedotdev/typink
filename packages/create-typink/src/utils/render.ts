import chalk from 'chalk';
import { Options } from '../types.js';

export const INTRO_ART = `
░█▀▀░█▀▄░█▀▀░█▀█░▀█▀░█▀▀░░░░░▀█▀░█░█░█▀█░▀█▀░█▀█░█░█░
░█░░░█▀▄░█▀▀░█▀█░░█░░█▀▀░▄▄▄░░█░░░█░░█▀▀░░█░░█░█░█▀▄░
░▀▀▀░▀░▀░▀▀▀░▀░▀░░▀░░▀▀▀░░░░░░▀░░░▀░░▀░░░▀▀▀░▀░▀░▀░▀░
`;

export function renderIntroArt() {
  console.log(INTRO_ART);
}

export function renderHelpMessage() {
  console.log(` ${chalk.bold.blue('Usage:')}
    ${chalk.bold.green('npx create-typink<@version>')} ${chalk.gray('[--skip | --skip-install] [-n <project-name> | --name <project-name>] [-w <wallet-connector> | --wallet <wallet-connector>] [-i <ink-version> | --ink-version <ink-version>] [-t <template-name> | --template <template-name>] [-e <example-contract> | --example <example-contract>] [-N <network-name> | --network <network-name>] [--no-git] [-v | --version] [-h | --help]')}
`);
  console.log(` ${chalk.bold.blue('Options:')}
    ${chalk.gray('-n, --name')}                       Project name
    ${chalk.gray('-w, --wallet')}                     Wallet connector <Default|Subconnect|Talisman Connect>
    ${chalk.gray('-i, --ink-version')}                Ink version <legacy|v6> (default: legacy)
    ${chalk.gray('-t, --template')}                   Template <default> (default: default)
    ${chalk.gray('-e, --example')}                    Example contract [legacy: <psp22|greeter>, v6: <psp22|flipper>]
    ${chalk.gray('-N, --network')}                    Network [legacy: <Pop Testnet|Aleph Zero Testnet|Aleph Zero Mainnet|Astar|Shiden|Shibuya>, v6: <Pop Testnet|Passet Hub|Westend Asset Hub>]
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
