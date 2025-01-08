import { describe, it, expect } from 'vitest';
import { formatBalance } from '../formatBalance.js';
import { TypinkError } from '../errors.js';

describe('formatBalance', () => {
  it('should work probably', () => {
    expect(formatBalance(1e12, { decimals: 12, symbol: 'AZERO' })).toEqual('1 AZERO');
    expect(formatBalance(1e12, { decimals: 13, symbol: 'AZERO' })).toEqual('0.1 AZERO');
    expect(formatBalance(12_023_172_837_123, { decimals: 12 })).toEqual('12.023172837123');
    expect(formatBalance('1', { decimals: 12 })).toEqual('0.000000000001');
    expect(formatBalance(1e12, { decimals: 13 })).toEqual('0.1');
    expect(formatBalance(-10000, { decimals: 4 })).toEqual('-1');
    expect(formatBalance('-10200', { decimals: 4 })).toEqual('-1.02');
    expect(formatBalance(-1e12, { decimals: 12, symbol: 'AZERO' })).toEqual('-1 AZERO');
  });

  it('should throw error if input has bad chars', () => {
    expect(() => formatBalance('1.000000000001', { decimals: 12 })).toThrow(
      new TypinkError('Invalid value at position 1, bigint was expected'),
    );
    expect(() => formatBalance('1,2', { decimals: 12, symbol: 'AZERO' })).toThrow(
      new TypinkError('Invalid value at position 1, bigint was expected'),
    );
  });

  it('should throw error if decimals is invalid', () => {
    expect(() => formatBalance('1', { decimals: 12.2, symbol: 'AZERO' })).toThrow(new TypinkError('Invalid decimals'));
    expect(() => formatBalance('1', { decimals: -12, symbol: 'AZERO' })).toThrow(new TypinkError('Invalid decimals'));
  });
});
