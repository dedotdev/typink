import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createStore } from 'jotai';
import {
  walletConnectionsAtomFamily,
  connectedWalletIdsAtom,
  connectedAccountAtom,
  allWalletConnectionsAtom,
  allAccountsAtom,
  effectiveSignerAtom,
  externalSignerAtom,
  finalEffectiveSignerAtom,
  availableWalletsAtom,
  connectedWalletsAtom,
  WalletConnection,
} from '../walletAtoms.js';
import { TypinkAccount, InjectedSigner } from '../../types.js';
import { Wallet } from '../../wallets/index.js';

describe('Wallet Atoms', () => {
  let store: ReturnType<typeof createStore>;

  const mockWallet = (id: string): Wallet => ({
    id,
    name: `Mock Wallet ${id}`,
    logo: 'mock-logo.png',
    options: {
      id,
      name: `Mock Wallet ${id}`,
      logo: 'mock-logo.png',
    },
    version: '1.0.0',
    injectedWeb3: {} as any,
    injectedProvider: null as any,
    ready: false,
    installed: false,
    waitUntilReady: vi.fn().mockResolvedValue(undefined),
  });

  const mockSigner = (walletId: string): InjectedSigner => ({
    signRaw: vi.fn().mockResolvedValue({
      id: 1,
      signature: '0xmocksignature',
    }),
    signPayload: vi.fn().mockResolvedValue({
      id: 1,
      signature: '0xmockpayload',
    }),
  });

  const mockTypinkAccount = (address: string, source: string, name?: string): TypinkAccount => ({
    address,
    source,
    name,
  });

  const mockWalletConnection = (walletId: string, accounts: TypinkAccount[]): WalletConnection => ({
    walletId,
    wallet: mockWallet(walletId),
    signer: mockSigner(walletId),
    accounts,
    subscription: vi.fn(),
  });

  beforeEach(() => {
    store = createStore();
    vi.clearAllMocks();
  });

  describe('walletConnectionsAtomFamily', () => {
    it('should create independent atoms for different wallet IDs', () => {
      const polkadotConnectionAtom = walletConnectionsAtomFamily('polkadot-js');
      const talismanConnectionAtom = walletConnectionsAtomFamily('talisman');

      const polkadotConnection = mockWalletConnection('polkadot-js', [
        mockTypinkAccount('5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY', 'polkadot-js', 'Alice'),
      ]);
      const talismanConnection = mockWalletConnection('talisman', [
        mockTypinkAccount('5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty', 'talisman', 'Bob'),
      ]);

      store.set(polkadotConnectionAtom, polkadotConnection);
      store.set(talismanConnectionAtom, talismanConnection);

      const polkadotResult = store.get(polkadotConnectionAtom);
      const talismanResult = store.get(talismanConnectionAtom);

      expect(polkadotResult).toEqual(polkadotConnection);
      expect(talismanResult).toEqual(talismanConnection);
      expect(polkadotResult).not.toBe(talismanResult);
    });

    it('should return null initially', () => {
      const connectionAtom = walletConnectionsAtomFamily('polkadot-js');
      const result = store.get(connectionAtom);
      expect(result).toBeNull();
    });

    it('should allow setting null to disconnect', () => {
      const connectionAtom = walletConnectionsAtomFamily('polkadot-js');
      const connection = mockWalletConnection('polkadot-js', []);

      store.set(connectionAtom, connection);
      expect(store.get(connectionAtom)).toEqual(connection);

      store.set(connectionAtom, null);
      expect(store.get(connectionAtom)).toBeNull();
    });
  });

  describe('connectedWalletIdsAtom', () => {
    it('should start with empty array', () => {
      const result = store.get(connectedWalletIdsAtom);
      expect(result).toEqual([]);
    });

    it('should store and retrieve wallet IDs', () => {
      const walletIds = ['polkadot-js', 'talisman', 'subwallet'];
      store.set(connectedWalletIdsAtom, walletIds);

      const result = store.get(connectedWalletIdsAtom);
      expect(result).toEqual(walletIds);
    });

    it('should handle single wallet ID', () => {
      const walletIds = ['polkadot-js'];
      store.set(connectedWalletIdsAtom, walletIds);

      const result = store.get(connectedWalletIdsAtom);
      expect(result).toEqual(walletIds);
    });

    it('should handle duplicate wallet IDs gracefully', () => {
      const walletIds = ['polkadot-js', 'polkadot-js', 'talisman'];
      store.set(connectedWalletIdsAtom, walletIds);

      const result = store.get(connectedWalletIdsAtom);
      expect(result).toEqual(walletIds); // Should preserve duplicates if set manually
    });
  });

  describe('connectedAccountAtom', () => {
    it('should start with undefined', () => {
      const result = store.get(connectedAccountAtom);
      expect(result).toBeUndefined();
    });

    it('should store and retrieve connected account', () => {
      const account = mockTypinkAccount('5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY', 'polkadot-js', 'Alice');
      store.set(connectedAccountAtom, account);

      const result = store.get(connectedAccountAtom);
      expect(result).toEqual(account);
    });

    it('should allow setting back to undefined', () => {
      const account = mockTypinkAccount('5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY', 'polkadot-js', 'Alice');
      store.set(connectedAccountAtom, account);
      expect(store.get(connectedAccountAtom)).toEqual(account);

      store.set(connectedAccountAtom, undefined);
      expect(store.get(connectedAccountAtom)).toBeUndefined();
    });
  });

  describe('allWalletConnectionsAtom', () => {
    it('should return empty map when no wallets connected', () => {
      const result = store.get(allWalletConnectionsAtom);
      expect(result).toBeInstanceOf(Map);
      expect(result.size).toBe(0);
    });

    it('should aggregate connections from connected wallet IDs', () => {
      const polkadotConnection = mockWalletConnection('polkadot-js', [
        mockTypinkAccount('5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY', 'polkadot-js', 'Alice'),
      ]);
      const talismanConnection = mockWalletConnection('talisman', [
        mockTypinkAccount('5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty', 'talisman', 'Bob'),
      ]);

      // Set up connections
      store.set(walletConnectionsAtomFamily('polkadot-js'), polkadotConnection);
      store.set(walletConnectionsAtomFamily('talisman'), talismanConnection);

      // Set connected wallet IDs
      store.set(connectedWalletIdsAtom, ['polkadot-js', 'talisman']);

      const result = store.get(allWalletConnectionsAtom);
      expect(result.size).toBe(2);
      expect(result.get('polkadot-js')).toEqual(polkadotConnection);
      expect(result.get('talisman')).toEqual(talismanConnection);
    });

    it('should skip wallet IDs without connections', () => {
      const polkadotConnection = mockWalletConnection('polkadot-js', [
        mockTypinkAccount('5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY', 'polkadot-js', 'Alice'),
      ]);

      // Only set one connection but list multiple IDs
      store.set(walletConnectionsAtomFamily('polkadot-js'), polkadotConnection);
      store.set(connectedWalletIdsAtom, ['polkadot-js', 'talisman']);

      const result = store.get(allWalletConnectionsAtom);
      expect(result.size).toBe(1);
      expect(result.get('polkadot-js')).toEqual(polkadotConnection);
      expect(result.has('talisman')).toBe(false);
    });

    it('should update when connections are added or removed', () => {
      // Start with one connection
      const polkadotConnection = mockWalletConnection('polkadot-js', [
        mockTypinkAccount('5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY', 'polkadot-js'),
      ]);
      store.set(walletConnectionsAtomFamily('polkadot-js'), polkadotConnection);
      store.set(connectedWalletIdsAtom, ['polkadot-js']);

      let result = store.get(allWalletConnectionsAtom);
      expect(result.size).toBe(1);

      // Add another connection
      const talismanConnection = mockWalletConnection('talisman', [
        mockTypinkAccount('5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty', 'talisman'),
      ]);
      store.set(walletConnectionsAtomFamily('talisman'), talismanConnection);
      store.set(connectedWalletIdsAtom, ['polkadot-js', 'talisman']);

      result = store.get(allWalletConnectionsAtom);
      expect(result.size).toBe(2);

      // Remove one connection
      store.set(walletConnectionsAtomFamily('polkadot-js'), null);

      result = store.get(allWalletConnectionsAtom);
      expect(result.size).toBe(1);
      expect(result.has('polkadot-js')).toBe(false);
      expect(result.get('talisman')).toEqual(talismanConnection);
    });
  });

  describe('allAccountsAtom', () => {
    it('should return empty array when no connections', () => {
      const result = store.get(allAccountsAtom);
      expect(result).toEqual([]);
    });

    it('should aggregate accounts from all connections', () => {
      const polkadotAccounts = [
        mockTypinkAccount('5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY', 'polkadot-js', 'Alice'),
        mockTypinkAccount('5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty', 'polkadot-js', 'Bob'),
      ];
      const talismanAccounts = [
        mockTypinkAccount('5Ff3iXP75ruzrDB9N3MultVw3pX9vLEEnyNaHyNaKoVKMc82', 'talisman', 'Charlie'),
      ];

      const polkadotConnection = mockWalletConnection('polkadot-js', polkadotAccounts);
      const talismanConnection = mockWalletConnection('talisman', talismanAccounts);

      store.set(walletConnectionsAtomFamily('polkadot-js'), polkadotConnection);
      store.set(walletConnectionsAtomFamily('talisman'), talismanConnection);
      store.set(connectedWalletIdsAtom, ['polkadot-js', 'talisman']);

      const result = store.get(allAccountsAtom);
      expect(result).toHaveLength(3);
      expect(result).toEqual([...polkadotAccounts, ...talismanAccounts]);
    });

    it('should handle connections with empty accounts', () => {
      const polkadotConnection = mockWalletConnection('polkadot-js', []);
      const talismanAccounts = [
        mockTypinkAccount('5Ff3iXP75ruzrDB9N3MultVw3pX9vLEEnyNaHyNaKoVKMc82', 'talisman', 'Charlie'),
      ];
      const talismanConnection = mockWalletConnection('talisman', talismanAccounts);

      store.set(walletConnectionsAtomFamily('polkadot-js'), polkadotConnection);
      store.set(walletConnectionsAtomFamily('talisman'), talismanConnection);
      store.set(connectedWalletIdsAtom, ['polkadot-js', 'talisman']);

      const result = store.get(allAccountsAtom);
      expect(result).toHaveLength(1);
      expect(result).toEqual(talismanAccounts);
    });

    it('should update when accounts are modified in connections', () => {
      const initialAccounts = [
        mockTypinkAccount('5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY', 'polkadot-js', 'Alice'),
      ];
      const polkadotConnection = mockWalletConnection('polkadot-js', initialAccounts);

      store.set(walletConnectionsAtomFamily('polkadot-js'), polkadotConnection);
      store.set(connectedWalletIdsAtom, ['polkadot-js']);

      let result = store.get(allAccountsAtom);
      expect(result).toHaveLength(1);

      // Update connection with more accounts
      const updatedAccounts = [
        ...initialAccounts,
        mockTypinkAccount('5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty', 'polkadot-js', 'Bob'),
      ];
      const updatedConnection = { ...polkadotConnection, accounts: updatedAccounts };
      store.set(walletConnectionsAtomFamily('polkadot-js'), updatedConnection);

      result = store.get(allAccountsAtom);
      expect(result).toHaveLength(2);
      expect(result).toEqual(updatedAccounts);
    });
  });

  describe('effectiveSignerAtom', () => {
    it('should return undefined when no connected account', () => {
      const result = store.get(effectiveSignerAtom);
      expect(result).toBeUndefined();
    });

    it('should return signer from connected account wallet', () => {
      const account = mockTypinkAccount('5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY', 'polkadot-js', 'Alice');
      const connection = mockWalletConnection('polkadot-js', [account]);

      store.set(connectedAccountAtom, account);
      store.set(walletConnectionsAtomFamily('polkadot-js'), connection);
      store.set(connectedWalletIdsAtom, ['polkadot-js']);

      const result = store.get(effectiveSignerAtom);
      expect(result).toBe(connection.signer);
    });

    it('should return undefined when connected account wallet is not connected', () => {
      const account = mockTypinkAccount('5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY', 'polkadot-js', 'Alice');
      store.set(connectedAccountAtom, account);

      const result = store.get(effectiveSignerAtom);
      expect(result).toBeUndefined();
    });

    it('should return undefined when wallet connection has no signer', () => {
      const account = mockTypinkAccount('5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY', 'polkadot-js', 'Alice');
      const connection = { ...mockWalletConnection('polkadot-js', [account]), signer: undefined as any };

      store.set(connectedAccountAtom, account);
      store.set(walletConnectionsAtomFamily('polkadot-js'), connection);
      store.set(connectedWalletIdsAtom, ['polkadot-js']);

      const result = store.get(effectiveSignerAtom);
      expect(result).toBeUndefined();
    });

    it('should update when connected account changes', () => {
      const aliceAccount = mockTypinkAccount('5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY', 'polkadot-js', 'Alice');
      const bobAccount = mockTypinkAccount('5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty', 'talisman', 'Bob');
      
      const polkadotConnection = mockWalletConnection('polkadot-js', [aliceAccount]);
      const talismanConnection = mockWalletConnection('talisman', [bobAccount]);

      store.set(walletConnectionsAtomFamily('polkadot-js'), polkadotConnection);
      store.set(walletConnectionsAtomFamily('talisman'), talismanConnection);
      store.set(connectedWalletIdsAtom, ['polkadot-js', 'talisman']);

      // Connect Alice first
      store.set(connectedAccountAtom, aliceAccount);
      let result = store.get(effectiveSignerAtom);
      expect(result).toBe(polkadotConnection.signer);

      // Switch to Bob
      store.set(connectedAccountAtom, bobAccount);
      result = store.get(effectiveSignerAtom);
      expect(result).toBe(talismanConnection.signer);
    });
  });

  describe('externalSignerAtom', () => {
    it('should start with undefined', () => {
      const result = store.get(externalSignerAtom);
      expect(result).toBeUndefined();
    });

    it('should store and retrieve external signer', () => {
      const externalSigner = mockSigner('external');
      store.set(externalSignerAtom, externalSigner);

      const result = store.get(externalSignerAtom);
      expect(result).toBe(externalSigner);
    });

    it('should allow setting back to undefined', () => {
      const externalSigner = mockSigner('external');
      store.set(externalSignerAtom, externalSigner);
      expect(store.get(externalSignerAtom)).toBe(externalSigner);

      store.set(externalSignerAtom, undefined);
      expect(store.get(externalSignerAtom)).toBeUndefined();
    });
  });

  describe('finalEffectiveSignerAtom', () => {
    it('should return external signer when both exist (priority)', () => {
      const externalSigner = mockSigner('external');
      const account = mockTypinkAccount('5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY', 'polkadot-js', 'Alice');
      const connection = mockWalletConnection('polkadot-js', [account]);

      store.set(externalSignerAtom, externalSigner);
      store.set(connectedAccountAtom, account);
      store.set(walletConnectionsAtomFamily('polkadot-js'), connection);
      store.set(connectedWalletIdsAtom, ['polkadot-js']);

      const result = store.get(finalEffectiveSignerAtom);
      expect(result).toBe(externalSigner);
    });

    it('should return account-based signer when no external signer', () => {
      const account = mockTypinkAccount('5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY', 'polkadot-js', 'Alice');
      const connection = mockWalletConnection('polkadot-js', [account]);

      store.set(connectedAccountAtom, account);
      store.set(walletConnectionsAtomFamily('polkadot-js'), connection);
      store.set(connectedWalletIdsAtom, ['polkadot-js']);

      const result = store.get(finalEffectiveSignerAtom);
      expect(result).toBe(connection.signer);
    });

    it('should return undefined when no signers available', () => {
      const result = store.get(finalEffectiveSignerAtom);
      expect(result).toBeUndefined();
    });

    it('should update when external signer is removed', () => {
      const externalSigner = mockSigner('external');
      const account = mockTypinkAccount('5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY', 'polkadot-js', 'Alice');
      const connection = mockWalletConnection('polkadot-js', [account]);

      store.set(externalSignerAtom, externalSigner);
      store.set(connectedAccountAtom, account);
      store.set(walletConnectionsAtomFamily('polkadot-js'), connection);
      store.set(connectedWalletIdsAtom, ['polkadot-js']);

      let result = store.get(finalEffectiveSignerAtom);
      expect(result).toBe(externalSigner);

      // Remove external signer
      store.set(externalSignerAtom, undefined);
      result = store.get(finalEffectiveSignerAtom);
      expect(result).toBe(connection.signer);
    });
  });

  describe('availableWalletsAtom', () => {
    it('should start with empty array', () => {
      const result = store.get(availableWalletsAtom);
      expect(result).toEqual([]);
    });

    it('should store and retrieve available wallets', () => {
      const wallets = [
        mockWallet('polkadot-js'),
        mockWallet('talisman'),
        mockWallet('subwallet'),
      ];
      store.set(availableWalletsAtom, wallets);

      const result = store.get(availableWalletsAtom);
      expect(result).toEqual(wallets);
    });
  });

  describe('connectedWalletsAtom', () => {
    it('should return empty array when no connected wallets', () => {
      const result = store.get(connectedWalletsAtom);
      expect(result).toEqual([]);
    });

    it('should derive connected wallets from IDs and available wallets', () => {
      const availableWallets = [
        mockWallet('polkadot-js'),
        mockWallet('talisman'),
        mockWallet('subwallet'),
      ];
      const connectedWalletIds = ['polkadot-js', 'talisman'];

      store.set(availableWalletsAtom, availableWallets);
      store.set(connectedWalletIdsAtom, connectedWalletIds);

      const result = store.get(connectedWalletsAtom);
      expect(result).toHaveLength(2);
      expect(result[0]).toBe(availableWallets[0]); // polkadot-js
      expect(result[1]).toBe(availableWallets[1]); // talisman
    });

    it('should filter out wallet IDs not in available wallets', () => {
      const availableWallets = [
        mockWallet('polkadot-js'),
        mockWallet('talisman'),
      ];
      const connectedWalletIds = ['polkadot-js', 'unknown-wallet', 'talisman'];

      store.set(availableWalletsAtom, availableWallets);
      store.set(connectedWalletIdsAtom, connectedWalletIds);

      const result = store.get(connectedWalletsAtom);
      expect(result).toHaveLength(2);
      expect(result.map(w => w.id)).toEqual(['polkadot-js', 'talisman']);
    });

    it('should maintain order based on connected wallet IDs', () => {
      const availableWallets = [
        mockWallet('polkadot-js'),
        mockWallet('talisman'),
        mockWallet('subwallet'),
      ];
      const connectedWalletIds = ['talisman', 'polkadot-js']; // Different order

      store.set(availableWalletsAtom, availableWallets);
      store.set(connectedWalletIdsAtom, connectedWalletIds);

      const result = store.get(connectedWalletsAtom);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('talisman');
      expect(result[1].id).toBe('polkadot-js');
    });

    it('should update when connected wallet IDs change', () => {
      const availableWallets = [
        mockWallet('polkadot-js'),
        mockWallet('talisman'),
      ];

      store.set(availableWalletsAtom, availableWallets);
      store.set(connectedWalletIdsAtom, ['polkadot-js']);

      let result = store.get(connectedWalletsAtom);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('polkadot-js');

      // Add another wallet
      store.set(connectedWalletIdsAtom, ['polkadot-js', 'talisman']);
      result = store.get(connectedWalletsAtom);
      expect(result).toHaveLength(2);

      // Remove all wallets
      store.set(connectedWalletIdsAtom, []);
      result = store.get(connectedWalletsAtom);
      expect(result).toHaveLength(0);
    });
  });

  describe('Edge Cases and Integration', () => {
    it('should handle multiple accounts from same wallet in different atoms', () => {
      const accounts = [
        mockTypinkAccount('5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY', 'polkadot-js', 'Alice'),
        mockTypinkAccount('5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty', 'polkadot-js', 'Bob'),
        mockTypinkAccount('5Ff3iXP75ruzrDB9N3MultVw3pX9vLEEnyNaHyNaKoVKMc82', 'polkadot-js', 'Charlie'),
      ];
      const connection = mockWalletConnection('polkadot-js', accounts);

      store.set(walletConnectionsAtomFamily('polkadot-js'), connection);
      store.set(connectedWalletIdsAtom, ['polkadot-js']);

      const allAccounts = store.get(allAccountsAtom);
      expect(allAccounts).toHaveLength(3);

      // Connect to second account
      store.set(connectedAccountAtom, accounts[1]);
      const effectiveSigner = store.get(effectiveSignerAtom);
      expect(effectiveSigner).toBe(connection.signer);
    });

    it('should handle empty wallet connections gracefully', () => {
      const connection = mockWalletConnection('polkadot-js', []);
      store.set(walletConnectionsAtomFamily('polkadot-js'), connection);
      store.set(connectedWalletIdsAtom, ['polkadot-js']);

      const allConnections = store.get(allWalletConnectionsAtom);
      const allAccounts = store.get(allAccountsAtom);

      expect(allConnections.size).toBe(1);
      expect(allAccounts).toEqual([]);
    });

    it('should maintain consistency across related atoms', () => {
      const wallets = [mockWallet('polkadot-js'), mockWallet('talisman')];
      const accounts = [
        mockTypinkAccount('5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY', 'polkadot-js', 'Alice'),
        mockTypinkAccount('5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty', 'talisman', 'Bob'),
      ];
      const connections = [
        mockWalletConnection('polkadot-js', [accounts[0]]),
        mockWalletConnection('talisman', [accounts[1]]),
      ];

      // Set up complete state
      store.set(availableWalletsAtom, wallets);
      store.set(connectedWalletIdsAtom, ['polkadot-js', 'talisman']);
      store.set(walletConnectionsAtomFamily('polkadot-js'), connections[0]);
      store.set(walletConnectionsAtomFamily('talisman'), connections[1]);
      store.set(connectedAccountAtom, accounts[0]);

      // Verify all derived atoms are consistent
      const connectedWallets = store.get(connectedWalletsAtom);
      const allConnections = store.get(allWalletConnectionsAtom);
      const allAccounts = store.get(allAccountsAtom);
      const effectiveSigner = store.get(effectiveSignerAtom);
      const finalSigner = store.get(finalEffectiveSignerAtom);

      expect(connectedWallets).toHaveLength(2);
      expect(allConnections.size).toBe(2);
      expect(allAccounts).toHaveLength(2);
      expect(effectiveSigner).toBe(connections[0].signer);
      expect(finalSigner).toBe(connections[0].signer);
    });
  });
});