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
    ${chalk.bold.green('create-typink')} ${chalk.gray('[options]...')}
`);
  console.log(` ${chalk.bold.blue('Options:')}
    ${chalk.gray('-n, --name')}                       Project name
    ${chalk.gray('-t, --template')}                   Template to use (available template: inkv6-nextjs, inkv6-sol-nextjs, sol-nextjs, inkv5-nextjs) 
    ${chalk.gray('-N, --networks')}                   Supported networks [pallet-contracts: <Pop Testnet|Aleph Zero Testnet|Aleph Zero|Astar>, pallet-revive: <Passet Hub|Pop Testnet>]
    ${chalk.gray('--skip, --skip-install')}           Skip packages installation
    ${chalk.gray('--no-git')}                         Skip git initialization
    ${chalk.gray('-h, --help')}                       Show help
    `);
}

export function renderOutroMessage(options: Options) {
  const pkgManagerName = options.pkgManager.name;

  if (options.skipInstall) {
    console.log(`\n${chalk.bold.green('🎉 Your project is ready!')}
${chalk.bold.blue('➡️ To get started:')}
    ${chalk.bold.blue(`$ cd ${options.projectName}`)}
    ${chalk.bold.blue(`$ ${pkgManagerName} install`)}
    ${chalk.bold.blue(`$ ${['bun', 'yarn', 'pnpm'].includes(pkgManagerName) ? `${pkgManagerName} dev` : `${pkgManagerName} run dev`}`)}
`);
  } else {
    console.log(`\n${chalk.bold.green('🎉 Your project is ready!')}
${chalk.bold.blue('➡️ To get started:')}
    ${chalk.bold.blue(`$ cd ${options.projectName}`)}
    ${chalk.bold.blue(`$ ${['bun', 'yarn', 'pnpm'].includes(pkgManagerName) ? `${pkgManagerName} dev` : `${pkgManagerName} run dev`}`)}
`);
  }
}
