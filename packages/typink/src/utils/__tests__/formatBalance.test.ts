import { describe, it, expect } from 'vitest';
import { formatBalance } from '../formatBalance';

describe('formatBalance', () => {
  
  it('case 1', () => {
    expect(formatBalance(1e12, { decimals: 12, symbol: 'AZERO' })).toEqual('1 AZERO');
  });

  it('case 2', () => {
    expect(formatBalance(1e12, { decimals: 13, symbol: 'AZERO' })).toEqual('0.1 AZERO');
  });

  it('case 3', () => {
    expect(formatBalance(1e12, { decimals: 13 })).toEqual('0.1');
  });

  it('case 4', () => {
    expect(formatBalance(12_023_172_837_123, { decimals: 12 })).toEqual('12.023172837123');
  });

  it('case 5', () => {
    expect(formatBalance('1', { decimals: 12 })).toEqual('0.000000000001');
  });

  // Unhandled case
  /*
  it('case 6', () => {
    expect(formatBalance('1.000000000001', { decimals: 12 })).toEqual('1.000000000001');
  });
  */

  it('case 7', () => {
    expect(() => formatBalance('1', { decimals: 12.2, symbol: 'AZERO' })).toThrow(new Error('Invalid decimals'));
  });

  it('case 8', () => {
    expect(() => formatBalance('1,2', { decimals: 12, symbol: 'AZERO' })).toThrow(new Error('Invalid value at position 1'));
  });
});
