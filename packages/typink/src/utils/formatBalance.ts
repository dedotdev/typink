import { TypinkError } from './errors.js';

const SEPERATOR_SPOT_REGEX = /\B(?=(\d{3})+(?!\d))/g;

export interface FormatBalanceOptions {
  symbol?: string;
  decimals?: number;
  withAll?: boolean;
  locale?: string;
}

/**
 * Format a balance value to a human-readable string.
 *
 * @param value - The balance value.
 * @param options - The formatting options.
 * @param options.symbol - The currency symbol.
 * @param options.decimals - The decimals of network. (default: 0)
 * @param options.withAll - Whether to show all decimals. (default: false, only show up to 4 decimals)
 * @param options.locale - The locale to use for formatting. (default: 'en')
 *
 * @returns The formatted balance.
 */
export function formatBalance(value: number | bigint | string | undefined, options: FormatBalanceOptions): string {
  if (value === undefined) {
    return '';
  }

  const { decimals = 0, symbol, withAll = false, locale = 'en' } = options;

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

  const { thousand, decimal } = getSeparator(locale);

  return [
    isNegative && '-', // prettier-end-here
    wholePart.replace(SEPERATOR_SPOT_REGEX, thousand),
    decimalPart && `${decimal}${decimalPart}`,
    symbol && ` ${symbol}`,
  ]
    .filter(Boolean)
    .join('');
}

/**
 * Ref: https://github.com/polkadot-js/common/blob/master/packages/util/src/format/getSeparator.ts
 *
 * Get the decimal and thousand separator of a locale
 * @param locale
 * @returns {decimal: string, thousand: string}
 */
export function getSeparator(locale?: string): { thousand: string; decimal: string } {
  return {
    decimal: (0.1).toLocaleString(locale, { useGrouping: false }).charAt(1),
    thousand: (1000).toLocaleString(locale, { useGrouping: true }).replace(/\d/g, '').charAt(0),
  };
}
