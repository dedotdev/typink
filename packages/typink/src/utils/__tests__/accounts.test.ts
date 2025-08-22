import { describe, expect, it } from 'vitest';
import {
  filterAccountsByWallet,
  findAccountByAddress,
  groupAccountsByWallet,
  transformInjectedToTypinkAccounts,
} from '../accounts.js';
import { InjectedAccount, TypinkAccount } from '../../types.js';

describe('accounts utilities', () => {
  const mockInjectedAccounts: InjectedAccount[] = [
    {
      address: '5FXjUGjJf2xVwjVtxJmQtMnJKAZBd7eJpBgGKPJw6AjKTSzP',
      name: 'Alice',
    },
    {
      address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
      name: 'Bob',
    },
    {
      address: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
      name: 'Charlie',
    },
  ];

  const mockTypinkAccounts: TypinkAccount[] = [
    {
      address: '5FXjUGjJf2xVwjVtxJmQtMnJKAZBd7eJpBgGKPJw6AjKTSzP',
      name: 'Alice',
      source: 'subwallet-js',
    },
    {
      address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
      name: 'Bob',
      source: 'talisman',
    },
    {
      address: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
      name: 'Charlie',
      source: 'subwallet-js',
    },
  ];

  describe('transformInjectedToTypinkAccounts', () => {
    it('should transform injected accounts to typink accounts with source', () => {
      const result = transformInjectedToTypinkAccounts(mockInjectedAccounts, 'subwallet-js');

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        address: '5FXjUGjJf2xVwjVtxJmQtMnJKAZBd7eJpBgGKPJw6AjKTSzP',
        name: 'Alice',
        source: 'subwallet-js',
      });
      expect(result[1]).toEqual({
        address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
        name: 'Bob',
        source: 'subwallet-js',
      });
      expect(result[2]).toEqual({
        address: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
        name: 'Charlie',
        source: 'subwallet-js',
      });
    });

    it('should return empty array when walletSource is undefined', () => {
      const result = transformInjectedToTypinkAccounts(mockInjectedAccounts, undefined);
      expect(result).toEqual([]);
    });

    it('should return empty array when walletSource is empty string', () => {
      const result = transformInjectedToTypinkAccounts(mockInjectedAccounts, '');
      expect(result).toEqual([]);
    });

    it('should handle empty injected accounts array', () => {
      const result = transformInjectedToTypinkAccounts([], 'subwallet-js');
      expect(result).toEqual([]);
    });
  });

  describe('filterAccountsByWallet', () => {
    it('should filter accounts by wallet source', () => {
      const result = filterAccountsByWallet(mockTypinkAccounts, 'subwallet-js');

      expect(result).toHaveLength(2);
      expect(result[0].address).toBe('5FXjUGjJf2xVwjVtxJmQtMnJKAZBd7eJpBgGKPJw6AjKTSzP');
      expect(result[0].source).toBe('subwallet-js');
      expect(result[1].address).toBe('5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty');
      expect(result[1].source).toBe('subwallet-js');
    });

    it('should return empty array when no accounts match the wallet source', () => {
      const result = filterAccountsByWallet(mockTypinkAccounts, 'polkadot-js');
      expect(result).toEqual([]);
    });

    it('should handle empty accounts array', () => {
      const result = filterAccountsByWallet([], 'subwallet-js');
      expect(result).toEqual([]);
    });
  });

  describe('groupAccountsByWallet', () => {
    it('should group accounts by wallet source', () => {
      const result = groupAccountsByWallet(mockTypinkAccounts);

      expect(Object.keys(result)).toHaveLength(2);
      expect(result['subwallet-js']).toHaveLength(2);
      expect(result['talisman']).toHaveLength(1);

      expect(result['subwallet-js'][0].name).toBe('Alice');
      expect(result['subwallet-js'][1].name).toBe('Charlie');
      expect(result['talisman'][0].name).toBe('Bob');
    });

    it('should handle empty accounts array', () => {
      const result = groupAccountsByWallet([]);
      expect(result).toEqual({});
    });

    it('should handle accounts from single wallet', () => {
      const singleWalletAccounts = mockTypinkAccounts.filter((acc) => acc.source === 'subwallet-js');
      const result = groupAccountsByWallet(singleWalletAccounts);

      expect(Object.keys(result)).toHaveLength(1);
      expect(result['subwallet-js']).toHaveLength(2);
    });
  });

  describe('findAccountByAddress', () => {
    it('should find account by address', () => {
      const result = findAccountByAddress(mockTypinkAccounts, '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY');

      expect(result).toBeDefined();
      expect(result?.name).toBe('Bob');
      expect(result?.source).toBe('talisman');
      expect(result?.address).toBe('5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY');
    });

    it('should return undefined when account is not found', () => {
      const result = findAccountByAddress(mockTypinkAccounts, '5FNonExistentAddressHere');
      expect(result).toBeUndefined();
    });

    it('should handle empty accounts array', () => {
      const result = findAccountByAddress([], '5FXjUGjJf2xVwjVtxJmQtMnJKAZBd7eJpBgGKPJw6AjKTSzP');
      expect(result).toBeUndefined();
    });

    it('should be case sensitive for addresses', () => {
      const result = findAccountByAddress(mockTypinkAccounts, '5fxjugjjf2xvwjvtxjmqtmnjkazbd7ejpbgKPJw6AjKTSzP');
      expect(result).toBeUndefined();
    });
  });
});
