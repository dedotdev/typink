import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createStore } from 'jotai';
import {
  appNameAtom,
  connectWalletAtom,
  disconnectWalletAtom,
  setConnectedAccountAtom,
  initializeWalletsAtom,
  initializeAppNameAtom,
  setExternalSignerAtom,
} from '../walletActions.js';
import {
  availableWalletsAtom,
  connectedAccountAtom,
  connectedWalletIdsAtom,
  externalSignerAtom,
  walletConnectionsAtomFamily,
  allWalletConnectionsAtom,
  allAccountsAtom,
} from '../walletAtoms.js';
import { InjectedSigner, TypinkAccount } from '../../types.js';
import { Wallet } from '../../wallets/index.js';

// Mock the transformInjectedToTypinkAccounts utility
vi.mock('../../utils/index.js', () => ({
  transformInjectedToTypinkAccounts: vi.fn((injectedAccounts, walletId) =>
    injectedAccounts.map((acc: any) => ({
      address: acc.address,
      source: walletId,
      name: acc.name,
    })),
  ),
}));

// Mock dedot/utils
vi.mock('dedot/utils', () => ({
  assert: vi.fn((condition, message) => {
    if (!condition) {
      throw new Error(message);
    }
  }),
}));

describe('Wallet Actions', () => {
  let store: ReturnType<typeof createStore>;

  const mockInjectedAccount = (address: string, name?: string) => ({
    address,
    name,
    type: 'sr25519',
  });

  const mockTypinkAccount = (address: string, source: string, name?: string): TypinkAccount => ({
    address,
    source,
    name,
  });

  const mockSigner = (): InjectedSigner => ({
    signRaw: vi.fn().mockResolvedValue({
      id: 1,
      signature: '0xmocksignature',
    }),
    signPayload: vi.fn().mockResolvedValue({
      id: 1,
      signature: '0xmockpayload',
    }),
  });

  const mockInjectedProvider = (accounts: any[] = [], enableError?: Error) => ({
    enable: vi.fn().mockImplementation((appName: string) => {
      if (enableError) {
        return Promise.reject(enableError);
      }
      return Promise.resolve({
        accounts: {
          get: vi.fn().mockResolvedValue(accounts),
          subscribe: vi.fn().mockImplementation((callback) => {
            // Return unsubscribe function
            return vi.fn();
          }),
        },
        signer: mockSigner(),
      });
    }),
  });

  const mockWallet = (id: string, provider?: any, readyError?: Error): Wallet => ({
    id,
    name: `Mock Wallet ${id}`,
    logo: 'mock-logo.png',
    homepage: 'https://mock-wallet.com',
    downloadUrl: 'https://download-mock-wallet.com',
    injectedProvider: provider,
    isReady: vi.fn().mockImplementation(() => {
      if (readyError) return Promise.reject(readyError);
      return Promise.resolve(true);
    }),
    waitUntilReady: vi.fn().mockImplementation(() => {
      if (readyError) return Promise.reject(readyError);
      return Promise.resolve();
    }),
  });

  beforeEach(() => {
    store = createStore();
    vi.clearAllMocks();
  });

  describe('appNameAtom', () => {
    it('should start with empty string', () => {
      const result = store.get(appNameAtom);
      expect(result).toBe('');
    });

    it('should store and retrieve app name', () => {
      store.set(appNameAtom, 'My DApp');
      const result = store.get(appNameAtom);
      expect(result).toBe('My DApp');
    });
  });

  describe('initializeAppNameAtom', () => {
    it('should set the app name', () => {
      store.set(initializeAppNameAtom, 'Test DApp');
      const result = store.get(appNameAtom);
      expect(result).toBe('Test DApp');
    });
  });

  describe('initializeWalletsAtom', () => {
    it('should set available wallets', () => {
      const wallets = [mockWallet('polkadot-js'), mockWallet('talisman')];
      store.set(initializeWalletsAtom, wallets);

      const result = store.get(availableWalletsAtom);
      expect(result).toEqual(wallets);
    });
  });

  describe('setExternalSignerAtom', () => {
    it('should set external signer', () => {
      const signer = mockSigner();
      store.set(setExternalSignerAtom, signer);

      const result = store.get(externalSignerAtom);
      expect(result).toBe(signer);
    });

    it('should allow clearing external signer', () => {
      const signer = mockSigner();
      store.set(setExternalSignerAtom, signer);
      expect(store.get(externalSignerAtom)).toBe(signer);

      store.set(setExternalSignerAtom, undefined);
      expect(store.get(externalSignerAtom)).toBeUndefined();
    });
  });

  describe('setConnectedAccountAtom', () => {
    it('should set connected account', () => {
      const account = mockTypinkAccount('5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY', 'polkadot-js', 'Alice');
      store.set(setConnectedAccountAtom, account);

      const result = store.get(connectedAccountAtom);
      expect(result).toEqual(account);
    });
  });

  describe('connectWalletAtom', () => {
    beforeEach(() => {
      store.set(initializeAppNameAtom, 'Test DApp');
    });

    it('should successfully connect wallet with accounts', async () => {
      const accounts = [
        mockInjectedAccount('5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY', 'Alice'),
        mockInjectedAccount('5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty', 'Bob'),
      ];
      const provider = mockInjectedProvider(accounts);
      const wallet = mockWallet('polkadot-js', provider);

      store.set(initializeWalletsAtom, [wallet]);

      await store.set(connectWalletAtom, 'polkadot-js');

      // Verify wallet was added to connected IDs
      const connectedIds = store.get(connectedWalletIdsAtom);
      expect(connectedIds).toContain('polkadot-js');

      // Verify connection was created
      const connectionAtom = walletConnectionsAtomFamily('polkadot-js');
      const connection = store.get(connectionAtom);
      expect(connection).toBeTruthy();
      expect(connection?.walletId).toBe('polkadot-js');
      expect(connection?.wallet).toBe(wallet);
      expect(connection?.accounts).toHaveLength(2);

      // Verify provider methods were called correctly
      expect(wallet.waitUntilReady).toHaveBeenCalled();
      expect(provider.enable).toHaveBeenCalledWith('Test DApp');
    });

    it('should handle wallet not found', async () => {
      const wallet = mockWallet('polkadot-js');
      store.set(initializeWalletsAtom, [wallet]);

      await expect(store.set(connectWalletAtom, 'unknown-wallet')).rejects.toThrow(
        'Wallet Id Not Found unknown-wallet',
      );
    });

    it('should handle wallet not ready', async () => {
      const readyError = new Error('Wallet not ready');
      const wallet = mockWallet('polkadot-js', undefined, readyError);
      store.set(initializeWalletsAtom, [wallet]);

      await expect(store.set(connectWalletAtom, 'polkadot-js')).rejects.toThrow('Wallet not ready');
    });

    it('should handle missing injected provider', async () => {
      const wallet = mockWallet('polkadot-js'); // No provider
      store.set(initializeWalletsAtom, [wallet]);

      await expect(store.set(connectWalletAtom, 'polkadot-js')).rejects.toThrow('Invalid Wallet: polkadot-js');
    });

    it('should handle missing enable method', async () => {
      const provider = {}; // No enable method
      const wallet = mockWallet('polkadot-js', provider);
      store.set(initializeWalletsAtom, [wallet]);

      await expect(store.set(connectWalletAtom, 'polkadot-js')).rejects.toThrow('Invalid Wallet: polkadot-js');
    });

    it('should handle enable failure', async () => {
      const enableError = new Error('User denied connection');
      const provider = mockInjectedProvider([], enableError);
      const wallet = mockWallet('polkadot-js', provider);
      store.set(initializeWalletsAtom, [wallet]);

      await expect(store.set(connectWalletAtom, 'polkadot-js')).rejects.toThrow('User denied connection');
    });

    it('should handle wallet with no accounts', async () => {
      const provider = mockInjectedProvider([]); // Empty accounts
      const wallet = mockWallet('polkadot-js', provider);
      store.set(initializeWalletsAtom, [wallet]);

      await store.set(connectWalletAtom, 'polkadot-js');

      // Should not add to connected IDs when no accounts
      const connectedIds = store.get(connectedWalletIdsAtom);
      expect(connectedIds).not.toContain('polkadot-js');

      // Should not create connection
      const connectionAtom = walletConnectionsAtomFamily('polkadot-js');
      const connection = store.get(connectionAtom);
      expect(connection).toBeNull();
    });

    it('should not create duplicate connections', async () => {
      const accounts = [mockInjectedAccount('5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY', 'Alice')];
      const provider = mockInjectedProvider(accounts);
      const wallet = mockWallet('polkadot-js', provider);

      store.set(initializeWalletsAtom, [wallet]);

      // Connect first time
      await store.set(connectWalletAtom, 'polkadot-js');
      let connectedIds = store.get(connectedWalletIdsAtom);
      expect(connectedIds).toEqual(['polkadot-js']);

      // Connect again
      await store.set(connectWalletAtom, 'polkadot-js');
      connectedIds = store.get(connectedWalletIdsAtom);
      expect(connectedIds).toEqual(['polkadot-js']); // Should still be just one
    });

    it('should handle multiple wallet connections', async () => {
      const polkadotAccounts = [mockInjectedAccount('5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY', 'Alice')];
      const talismanAccounts = [mockInjectedAccount('5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty', 'Bob')];

      const polkadotProvider = mockInjectedProvider(polkadotAccounts);
      const talismanProvider = mockInjectedProvider(talismanAccounts);

      const polkadotWallet = mockWallet('polkadot-js', polkadotProvider);
      const talismanWallet = mockWallet('talisman', talismanProvider);

      store.set(initializeWalletsAtom, [polkadotWallet, talismanWallet]);

      // Connect both wallets
      await store.set(connectWalletAtom, 'polkadot-js');
      await store.set(connectWalletAtom, 'talisman');

      const connectedIds = store.get(connectedWalletIdsAtom);
      expect(connectedIds).toContain('polkadot-js');
      expect(connectedIds).toContain('talisman');

      const allConnections = store.get(allWalletConnectionsAtom);
      expect(allConnections.size).toBe(2);

      const allAccounts = store.get(allAccountsAtom);
      expect(allAccounts).toHaveLength(2);
    });

    it('should set up account subscription correctly', async () => {
      const accounts = [mockInjectedAccount('5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY', 'Alice')];
      const subscribeFn = vi.fn().mockReturnValue(vi.fn());

      const provider = mockInjectedProvider(accounts);
      provider.enable = vi.fn().mockResolvedValue({
        accounts: {
          get: vi.fn().mockResolvedValue(accounts),
          subscribe: subscribeFn,
        },
        signer: mockSigner(),
      });

      const wallet = mockWallet('polkadot-js', provider);
      store.set(initializeWalletsAtom, [wallet]);

      await store.set(connectWalletAtom, 'polkadot-js');

      expect(subscribeFn).toHaveBeenCalled();

      const connectionAtom = walletConnectionsAtomFamily('polkadot-js');
      const connection = store.get(connectionAtom);
      expect(connection?.subscription).toBeDefined();
    });
  });

  describe('disconnectWalletAtom', () => {
    let subscription: ReturnType<typeof vi.fn>;

    beforeEach(async () => {
      store.set(initializeAppNameAtom, 'Test DApp');

      // Set up a connected wallet first
      const accounts = [mockInjectedAccount('5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY', 'Alice')];
      subscription = vi.fn();

      const provider = mockInjectedProvider(accounts);
      provider.enable = vi.fn().mockResolvedValue({
        accounts: {
          get: vi.fn().mockResolvedValue(accounts),
          subscribe: vi.fn().mockReturnValue(subscription),
        },
        signer: mockSigner(),
      });

      const wallet = mockWallet('polkadot-js', provider);
      store.set(initializeWalletsAtom, [wallet]);
      await store.set(connectWalletAtom, 'polkadot-js');

      // Set connected account from this wallet
      const typinkAccount = mockTypinkAccount(
        '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
        'polkadot-js',
        'Alice',
      );
      store.set(setConnectedAccountAtom, typinkAccount);
    });

    it('should disconnect specific wallet', () => {
      store.set(disconnectWalletAtom, 'polkadot-js');

      // Verify wallet removed from connected IDs
      const connectedIds = store.get(connectedWalletIdsAtom);
      expect(connectedIds).not.toContain('polkadot-js');

      // Verify connection removed
      const connectionAtom = walletConnectionsAtomFamily('polkadot-js');
      const connection = store.get(connectionAtom);
      expect(connection).toBeNull();

      // Verify subscription was cleaned up
      expect(subscription).toHaveBeenCalled();

      // Verify connected account was reset (since it was from this wallet)
      const connectedAccount = store.get(connectedAccountAtom);
      expect(connectedAccount).toBeUndefined();
    });

    it('should not affect connected account from different wallet', async () => {
      // Connect another wallet
      const talismanAccounts = [mockInjectedAccount('5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty', 'Bob')];
      const talismanProvider = mockInjectedProvider(talismanAccounts);
      const talismanWallet = mockWallet('talisman', talismanProvider);

      store.set(initializeWalletsAtom, [mockWallet('polkadot-js'), talismanWallet]);
      await store.set(connectWalletAtom, 'talisman');

      // Set connected account from talisman
      const talismanAccount = mockTypinkAccount('5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty', 'talisman', 'Bob');
      store.set(setConnectedAccountAtom, talismanAccount);

      // Disconnect polkadot-js
      store.set(disconnectWalletAtom, 'polkadot-js');

      // Connected account should remain (it's from talisman)
      const connectedAccount = store.get(connectedAccountAtom);
      expect(connectedAccount).toEqual(talismanAccount);
    });

    it('should disconnect all wallets when no ID provided', async () => {
      // Connect another wallet
      const talismanAccounts = [mockInjectedAccount('5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty', 'Bob')];
      const talismanProvider = mockInjectedProvider(talismanAccounts);
      const talismanWallet = mockWallet('talisman', talismanProvider);

      store.set(initializeWalletsAtom, [mockWallet('polkadot-js'), talismanWallet]);
      await store.set(connectWalletAtom, 'talisman');

      // Disconnect all
      store.set(disconnectWalletAtom, undefined);

      // All wallets should be disconnected
      const connectedIds = store.get(connectedWalletIdsAtom);
      expect(connectedIds).toEqual([]);

      // All connections should be null
      const polkadotConnection = store.get(walletConnectionsAtomFamily('polkadot-js'));
      const talismanConnection = store.get(walletConnectionsAtomFamily('talisman'));
      expect(polkadotConnection).toBeNull();
      expect(talismanConnection).toBeNull();

      // Connected account should be reset
      const connectedAccount = store.get(connectedAccountAtom);
      expect(connectedAccount).toBeUndefined();

      // All subscriptions should be cleaned up
      expect(subscription).toHaveBeenCalled();
    });

    it('should handle disconnecting non-existent wallet gracefully', () => {
      const initialConnectedIds = store.get(connectedWalletIdsAtom);
      const initialConnectedAccount = store.get(connectedAccountAtom);

      store.set(disconnectWalletAtom, 'non-existent-wallet');

      // State should remain unchanged
      const connectedIds = store.get(connectedWalletIdsAtom);
      const connectedAccount = store.get(connectedAccountAtom);
      expect(connectedIds).toEqual(initialConnectedIds);
      expect(connectedAccount).toEqual(initialConnectedAccount);
    });

    it('should handle missing subscription gracefully', () => {
      // Manually create connection without subscription
      const connectionAtom = walletConnectionsAtomFamily('test-wallet');
      store.set(connectionAtom, {
        walletId: 'test-wallet',
        wallet: mockWallet('test-wallet'),
        signer: mockSigner(),
        accounts: [],
        // No subscription
      });
      store.set(connectedWalletIdsAtom, ['test-wallet']);

      // Should not throw
      expect(() => store.set(disconnectWalletAtom, 'test-wallet')).not.toThrow();
    });
  });

  describe('Account Subscription Updates', () => {
    it('should update accounts when subscription fires', async () => {
      const initialAccounts = [mockInjectedAccount('5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY', 'Alice')];
      const updatedAccounts = [
        mockInjectedAccount('5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY', 'Alice'),
        mockInjectedAccount('5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty', 'Bob'),
      ];

      let subscriptionCallback: (accounts: any[]) => void;

      const provider = mockInjectedProvider(initialAccounts);
      provider.enable = vi.fn().mockResolvedValue({
        accounts: {
          get: vi.fn().mockResolvedValue(initialAccounts),
          subscribe: vi.fn().mockImplementation((callback) => {
            subscriptionCallback = callback;
            return vi.fn();
          }),
        },
        signer: mockSigner(),
      });

      const wallet = mockWallet('polkadot-js', provider);
      store.set(initializeWalletsAtom, [wallet]);
      store.set(initializeAppNameAtom, 'Test DApp');

      await store.set(connectWalletAtom, 'polkadot-js');

      // Initial state
      let allAccounts = store.get(allAccountsAtom);
      expect(allAccounts).toHaveLength(1);

      // Simulate subscription update
      subscriptionCallback!(updatedAccounts);

      // Accounts should be updated
      allAccounts = store.get(allAccountsAtom);
      expect(allAccounts).toHaveLength(2);
    });

    it('should reset connected account when account is removed from wallet', async () => {
      const initialAccounts = [
        mockInjectedAccount('5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY', 'Alice'),
        mockInjectedAccount('5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty', 'Bob'),
      ];
      const updatedAccounts = [
        mockInjectedAccount('5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty', 'Bob'), // Alice removed
      ];

      let subscriptionCallback: (accounts: any[]) => void;

      const provider = mockInjectedProvider(initialAccounts);
      provider.enable = vi.fn().mockResolvedValue({
        accounts: {
          get: vi.fn().mockResolvedValue(initialAccounts),
          subscribe: vi.fn().mockImplementation((callback) => {
            subscriptionCallback = callback;
            return vi.fn();
          }),
        },
        signer: mockSigner(),
      });

      const wallet = mockWallet('polkadot-js', provider);
      store.set(initializeWalletsAtom, [wallet]);
      store.set(initializeAppNameAtom, 'Test DApp');

      await store.set(connectWalletAtom, 'polkadot-js');

      // Connect to Alice's account
      const aliceAccount = mockTypinkAccount(
        '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
        'polkadot-js',
        'Alice',
      );
      store.set(setConnectedAccountAtom, aliceAccount);

      // Verify Alice is connected
      expect(store.get(connectedAccountAtom)).toEqual(aliceAccount);

      // Simulate Alice being removed from wallet
      subscriptionCallback!(updatedAccounts);

      // Connected account should be reset
      expect(store.get(connectedAccountAtom)).toBeUndefined();
    });

    it('should not reset connected account from different wallet', async () => {
      // Set up two wallets
      const polkadotAccounts = [mockInjectedAccount('5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY', 'Alice')];
      const talismanAccounts = [mockInjectedAccount('5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty', 'Bob')];

      let polkadotCallback: (accounts: any[]) => void;

      const polkadotProvider = mockInjectedProvider(polkadotAccounts);
      polkadotProvider.enable = vi.fn().mockResolvedValue({
        accounts: {
          get: vi.fn().mockResolvedValue(polkadotAccounts),
          subscribe: vi.fn().mockImplementation((callback) => {
            polkadotCallback = callback;
            return vi.fn();
          }),
        },
        signer: mockSigner(),
      });

      const talismanProvider = mockInjectedProvider(talismanAccounts);

      const polkadotWallet = mockWallet('polkadot-js', polkadotProvider);
      const talismanWallet = mockWallet('talisman', talismanProvider);

      store.set(initializeWalletsAtom, [polkadotWallet, talismanWallet]);
      store.set(initializeAppNameAtom, 'Test DApp');

      await store.set(connectWalletAtom, 'polkadot-js');
      await store.set(connectWalletAtom, 'talisman');

      // Connect to Bob's account (from Talisman)
      const bobAccount = mockTypinkAccount('5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty', 'talisman', 'Bob');
      store.set(setConnectedAccountAtom, bobAccount);

      // Simulate polkadot-js accounts being removed
      polkadotCallback!([]);

      // Bob's account should remain connected (it's from Talisman, not polkadot-js)
      expect(store.get(connectedAccountAtom)).toEqual(bobAccount);
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete wallet lifecycle', async () => {
      const accounts = [
        mockInjectedAccount('5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY', 'Alice'),
        mockInjectedAccount('5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty', 'Bob'),
      ];

      const provider = mockInjectedProvider(accounts);
      const wallet = mockWallet('polkadot-js', provider);
      const externalSigner = mockSigner();

      // Initialize
      store.set(initializeWalletsAtom, [wallet]);
      store.set(initializeAppNameAtom, 'Integration Test DApp');
      store.set(setExternalSignerAtom, externalSigner);

      // Connect wallet
      await store.set(connectWalletAtom, 'polkadot-js');

      // Verify connection
      let connectedIds = store.get(connectedWalletIdsAtom);
      let allAccounts = store.get(allAccountsAtom);
      expect(connectedIds).toContain('polkadot-js');
      expect(allAccounts).toHaveLength(2);

      // Connect account
      const aliceAccount = mockTypinkAccount(
        '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
        'polkadot-js',
        'Alice',
      );
      store.set(setConnectedAccountAtom, aliceAccount);

      // Verify account connection
      const connectedAccount = store.get(connectedAccountAtom);
      expect(connectedAccount).toEqual(aliceAccount);

      // Disconnect wallet
      store.set(disconnectWalletAtom, 'polkadot-js');

      // Verify cleanup
      connectedIds = store.get(connectedWalletIdsAtom);
      allAccounts = store.get(allAccountsAtom);
      const finalConnectedAccount = store.get(connectedAccountAtom);

      expect(connectedIds).not.toContain('polkadot-js');
      expect(allAccounts).toHaveLength(0);
      expect(finalConnectedAccount).toBeUndefined();

      // External signer should remain
      expect(store.get(externalSignerAtom)).toBe(externalSigner);
    });
  });
});
