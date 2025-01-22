import chalk from 'chalk';

export const INTRO_ART = `
${chalk.bold.red('                     _                 _               _       _            ')}
${chalk.bold.red('  ___ _ __ ___  __ _| |_ ___          | |_ _   _ _ __ (_)_ __ | | __        ')}
${chalk.bold.red(" / __| '__/ _ \\/ _` | __/ _ \\  _____  | __| | | | '_ \\| | '_ \\| |/ /    ")}
${chalk.bold.red('| (__| | |  __/ (_| | ||  __/ |_____| | |_| |_| | |_) | | | | |   <         ')}
${chalk.bold.red(' \\___|_|  \\___|\\__,_|\\__\\___|          \\__|\\__, | .__/|_|_| |_|_|_ \\')}
${chalk.bold.red('                                           |___/|_|                         ')}
`;

export function renderIntroArt() {
  console.log(INTRO_ART);
}
