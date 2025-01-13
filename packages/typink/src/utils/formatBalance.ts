import { TypinkError } from './errors.js';

export interface FormatBalanceOptions {
  decimals?: number;
  symbol?: string;
}

export function formatBalance(value: number | bigint | string | undefined, options: FormatBalanceOptions): string {
  if (value === undefined) {
    return '';
  } 

  const { decimals = 0, symbol } = options;

  let valueStr = value.toString();

  if (!Number.isInteger(decimals) || decimals < 0) {
    throw new TypinkError('Invalid decimals');
  }

  const isNegative = valueStr.at(0) === '-';
  if (isNegative) {
    valueStr = valueStr.slice(1);
  }

  const badChars = valueStr.match(/[^0-9]/);
  if (badChars) {
    throw new TypinkError(`Invalid value at position ${badChars.index ?? 0}, bigint was expected`);
  }

  const tmpStr = valueStr.padStart(decimals, '0').padEnd(decimals, '0');

  // If wholePart is empty, pad it with 0
  const wholePart = tmpStr.slice(0, tmpStr.length - decimals).padStart(1, '0');
  const decimalPart = tmpStr.slice(tmpStr.length - decimals).replace(/0+$/, '');

  return `${isNegative ? '-' : ''}${wholePart}${decimalPart ? `.${decimalPart}` : ''}${symbol ? ` ${symbol}` : ''}`;
}
