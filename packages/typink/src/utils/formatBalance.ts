import { TypinkError } from './errors.js';

export interface FormatBalanceOptions {
  symbol?: string;
  decimals?: number;
  withAll?: boolean;
}

/**
 * Format a balance value to a human-readable string.
 *
 * @param value - The balance value.
 * @param options - The formatting options.
 * @param options.symbol - The currency symbol.
 * @param options.decimals - The decimals of network. (default: 0)
 * @param options.withAll - Whether to show all decimals. (default: false, only show up to 4 decimals)
 *
 * @returns The formatted balance.
 */
export function formatBalance(value: number | bigint | string | undefined, options: FormatBalanceOptions): string {
  if (value === undefined) {
    return '';
  }

  const { decimals = 0, symbol, withAll = false } = options;

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

  const tmpStr = valueStr.padStart(decimals, '0');

  // If wholePart is empty, pad it with 0
  const wholePart = tmpStr.slice(0, tmpStr.length - decimals).padStart(1, '0');
  const decimalPart = tmpStr
    .slice(tmpStr.length - decimals)
    .substring(0, withAll ? decimals : Math.min(4, decimals))
    .replace(/0+$/, '');

  return [
    isNegative && '-', // prettier-end-here
    wholePart,
    decimalPart && `.${decimalPart}`,
    symbol && ` ${symbol}`,
  ]
    .filter(Boolean)
    .join('');
}
