import { describe, it, expect } from 'vitest';
import { TypinkAccount, InjectedAccount } from '../types.js';

describe('TypinkAccount', () => {
  it('should extend InjectedAccount with source field', () => {
    const injectedAccount: InjectedAccount = {
      address: '5FXjUGjJf2xVwjVtxJmQtMnJKAZBd7eJpBgGKPJw6AjKTSzP',
      name: 'Alice',
      genesisHash: '0x1234567890abcdef',
      type: 'sr25519',
    };

    const typinkAccount: TypinkAccount = {
      ...injectedAccount,
      source: 'subwallet-js',
    };

    // Should have all InjectedAccount properties
    expect(typinkAccount.address).toBe(injectedAccount.address);
    expect(typinkAccount.name).toBe(injectedAccount.name);
    expect(typinkAccount.genesisHash).toBe(injectedAccount.genesisHash);
    expect(typinkAccount.type).toBe(injectedAccount.type);

    // Should have the new source property
    expect(typinkAccount.source).toBe('subwallet-js');
  });

  it('should allow different wallet sources', () => {
    const accounts: TypinkAccount[] = [
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
        source: 'polkadot-js',
      },
    ];

    expect(accounts[0].source).toBe('subwallet-js');
    expect(accounts[1].source).toBe('talisman');
    expect(accounts[2].source).toBe('polkadot-js');

    // All should be valid TypinkAccounts
    accounts.forEach(account => {
      expect(typeof account.address).toBe('string');
      expect(typeof account.source).toBe('string');
    });
  });

  it('should support future non-injected wallet types', () => {
    // This demonstrates how the interface can support future wallet types
    const walletConnectAccount: TypinkAccount = {
      address: '5FXjUGjJf2xVwjVtxJmQtMnJKAZBd7eJpBgGKPJw6AjKTSzP',
      name: 'WalletConnect Account',
      source: 'walletconnect',
      // No genesisHash or type required (optional fields)
    };

    const ledgerAccount: TypinkAccount = {
      address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
      name: 'Ledger Account',
      source: 'ledger',
      type: 'ed25519',
    };

    expect(walletConnectAccount.source).toBe('walletconnect');
    expect(ledgerAccount.source).toBe('ledger');
    expect(ledgerAccount.type).toBe('ed25519');
  });

  it('should be assignable to InjectedAccount', () => {
    const typinkAccount: TypinkAccount = {
      address: '5FXjUGjJf2xVwjVtxJmQtMnJKAZBd7eJpBgGKPJw6AjKTSzP',
      name: 'Alice',
      source: 'subwallet-js',
    };

    // Should be able to assign TypinkAccount to InjectedAccount
    // This ensures backward compatibility
    const injectedAccount: InjectedAccount = {
      address: typinkAccount.address,
      name: typinkAccount.name,
      genesisHash: typinkAccount.genesisHash,
      type: typinkAccount.type,
    };

    expect(injectedAccount.address).toBe(typinkAccount.address);
    expect(injectedAccount.name).toBe(typinkAccount.name);
  });
});