import { InjectedAccount, TypinkAccount } from '../types.js';

/**
 * Transforms an array of InjectedAccount objects to TypinkAccount objects by adding the source property.
 * 
 * @param injectedAccounts - Array of InjectedAccount objects to transform
 * @param walletSource - The wallet ID/source to assign to all accounts (e.g., 'subwallet-js', 'talisman', 'polkadot-js')
 * @returns Array of TypinkAccount objects with the source property added
 * 
 * @example
 * ```typescript
 * const injectedAccounts = [
 *   { address: '5FXjUGjJf2xVwjVtxJmQtMnJKAZBd7eJpBgGKPJw6AjKTSzP', name: 'Alice' },
 *   { address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY', name: 'Bob' }
 * ];
 * 
 * const typinkAccounts = transformInjectedToTypinkAccounts(injectedAccounts, 'subwallet-js');
 * // Result: [
 * //   { address: '5FXjUGjJf2xVwjVtxJmQtMnJKAZBd7eJpBgGKPJw6AjKTSzP', name: 'Alice', source: 'subwallet-js' },
 * //   { address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY', name: 'Bob', source: 'subwallet-js' }
 * // ]
 * ```
 */
export function transformInjectedToTypinkAccounts(
  injectedAccounts: InjectedAccount[], 
  walletSource?: string
): TypinkAccount[] {
  if (!walletSource) return [];
  
  return injectedAccounts.map(account => ({
    source: walletSource,
    address: account.address,
    name: account.name,
  }));
}

/**
 * Filters TypinkAccount array by wallet source.
 * 
 * @param accounts - Array of TypinkAccount objects to filter
 * @param walletSource - The wallet source to filter by
 * @returns Array of TypinkAccount objects from the specified wallet source
 * 
 * @example
 * ```typescript
 * const accounts = [
 *   { address: '0x123', name: 'Alice', source: 'subwallet-js' },
 *   { address: '0x456', name: 'Bob', source: 'talisman' },
 *   { address: '0x789', name: 'Charlie', source: 'subwallet-js' }
 * ];
 * 
 * const subwalletAccounts = filterAccountsByWallet(accounts, 'subwallet-js');
 * // Result: [
 * //   { address: '0x123', name: 'Alice', source: 'subwallet-js' },
 * //   { address: '0x789', name: 'Charlie', source: 'subwallet-js' }
 * // ]
 * ```
 */
export function filterAccountsByWallet(accounts: TypinkAccount[], walletSource: string): TypinkAccount[] {
  return accounts.filter(account => account.source === walletSource);
}

/**
 * Groups TypinkAccount array by wallet source.
 * 
 * @param accounts - Array of TypinkAccount objects to group
 * @returns Record where keys are wallet sources and values are arrays of accounts from that source
 * 
 * @example
 * ```typescript
 * const accounts = [
 *   { address: '0x123', name: 'Alice', source: 'subwallet-js' },
 *   { address: '0x456', name: 'Bob', source: 'talisman' },
 *   { address: '0x789', name: 'Charlie', source: 'subwallet-js' }
 * ];
 * 
 * const groupedAccounts = groupAccountsByWallet(accounts);
 * // Result: {
 * //   'subwallet-js': [
 * //     { address: '0x123', name: 'Alice', source: 'subwallet-js' },
 * //     { address: '0x789', name: 'Charlie', source: 'subwallet-js' }
 * //   ],
 * //   'talisman': [
 * //     { address: '0x456', name: 'Bob', source: 'talisman' }
 * //   ]
 * // }
 * ```
 */
export function groupAccountsByWallet(accounts: TypinkAccount[]): Record<string, TypinkAccount[]> {
  return accounts.reduce((grouped, account) => {
    if (!grouped[account.source]) {
      grouped[account.source] = [];
    }
    grouped[account.source].push(account);
    return grouped;
  }, {} as Record<string, TypinkAccount[]>);
}

/**
 * Finds a TypinkAccount by address.
 * 
 * @param accounts - Array of TypinkAccount objects to search
 * @param address - The address to search for
 * @returns The matching TypinkAccount or undefined if not found
 * 
 * @example
 * ```typescript
 * const accounts = [
 *   { address: '5FXjUGjJf2xVwjVtxJmQtMnJKAZBd7eJpBgGKPJw6AjKTSzP', name: 'Alice', source: 'subwallet-js' },
 *   { address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY', name: 'Bob', source: 'talisman' }
 * ];
 * 
 * const account = findAccountByAddress(accounts, '5FXjUGjJf2xVwjVtxJmQtMnJKAZBd7eJpBgGKPJw6AjKTSzP');
 * // Result: { address: '5FXjUGjJf2xVwjVtxJmQtMnJKAZBd7eJpBgGKPJw6AjKTSzP', name: 'Alice', source: 'subwallet-js' }
 * ```
 */
export function findAccountByAddress(accounts: TypinkAccount[], address: string): TypinkAccount | undefined {
  return accounts.find(account => account.address === address);
}