export interface FormatBalanceOptions {
  decimals: number;
  symbol?: string;
}

export function formatBalance(value: number | bigint | string, options: FormatBalanceOptions): string {
  const { decimals, symbol } = options;

  // Do it with string
  let valueStr = value.toString();

  // Verify decimals in an integer
  if (!Number.isInteger(decimals) || decimals < 0) {
    throw new Error('Invalid decimals');
  }

  // Make sure the valueStr does have any bad characters

  const badChars = valueStr.match(/[^0-9.]/);
  if (badChars) {
 k  throw new Error(`Invalid value at position ${badChars.index ?? 0}`);
  }

  // Should we handle negative values? and how?
  // Should we handle the case where the value is a string with a decimal point?

  const tmpStr = valueStr.padStart(decimals, '0').padEnd(decimals, '0');
  const wholePart = tmpStr.slice(0, tmpStr.length - decimals).padStart(1, '0'); 
  const decimalPart = tmpStr.slice(tmpStr.length - decimals).replace(/0+$/, '');

  if (symbol) {
    return `${wholePart}${decimalPart ? `.${decimalPart}` : ''} ${symbol}`;
  }

  return `${wholePart}${decimalPart ? `.${decimalPart}` : ''}`;
}
