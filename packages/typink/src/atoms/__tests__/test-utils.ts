import { vi } from 'vitest';
import { createStore } from 'jotai';
import { Wallet } from '../../wallets/index.js';
import { NetworkInfo, TypinkAccount, InjectedSigner, JsonRpcApi, NetworkType } from '../../types.js';
import { CompatibleSubstrateApi } from '../../providers/ClientProvider.js';
import { WalletConnection } from '../walletAtoms.js';

/**
 * Creates a fresh Jotai store for testing with isolation
 */
export const createTestStore = () => createStore();

/**
 * Mock factory for creating InjectedSigner instances
 */
export const createMockSigner = (walletId?: string): InjectedSigner => ({
  signRaw: vi.fn().mockResolvedValue({
    id: 1,
    signature: `0x${walletId || 'mock'}signature`,
  }),
  signPayload: vi.fn().mockResolvedValue({
    id: 1,
    signature: `0x${walletId || 'mock'}payload`,
  }),
});

/**
 * Mock factory for creating TypinkAccount instances
 */
export const createMockTypinkAccount = (
  address: string,
  source: string,
  name?: string
): TypinkAccount => ({
  address,
  source,
  name,
});

/**
 * Mock factory for creating injected account objects (from wallet extensions)
 */
export const createMockInjectedAccount = (address: string, name?: string, type = 'sr25519') => ({
  address,
  name,
  type,
});

/**
 * Mock factory for creating Wallet instances
 */
export const createMockWallet = (
  id: string,
  options: {
    injectedProvider?: any;
    readyError?: Error;
    name?: string;
    logo?: string;
  } = {}
): Wallet => ({
  id,
  name: options.name || `Mock Wallet ${id}`,
  logo: options.logo || 'mock-logo.png',
  homepage: 'https://mock-wallet.com',
  downloadUrl: 'https://download-mock-wallet.com',
  injectedProvider: options.injectedProvider,
  isReady: vi.fn().mockImplementation(() => {
    if (options.readyError) return Promise.reject(options.readyError);
    return Promise.resolve(true);
  }),
  waitUntilReady: vi.fn().mockImplementation(() => {
    if (options.readyError) return Promise.reject(options.readyError);
    return Promise.resolve();
  }),
});

/**
 * Mock factory for creating injected provider instances
 */
export const createMockInjectedProvider = (
  accounts: any[] = [],
  options: {
    enableError?: Error;
    subscriptionCallback?: (accounts: any[]) => void;
  } = {}
) => {
  let currentAccounts = [...accounts];
  let subscriptionFn: ((accounts: any[]) => void) | null = null;

  return {
    enable: vi.fn().mockImplementation((appName: string) => {
      if (options.enableError) {
        return Promise.reject(options.enableError);
      }
      return Promise.resolve({
        accounts: {
          get: vi.fn().mockResolvedValue(currentAccounts),
          subscribe: vi.fn().mockImplementation((callback) => {
            subscriptionFn = callback;
            return vi.fn(); // Unsubscribe function
          }),
        },
        signer: createMockSigner(),
      });
    }),
    
    // Test utility to simulate account changes
    _simulateAccountsChange: (newAccounts: any[]) => {
      currentAccounts = [...newAccounts];
      if (subscriptionFn) {
        subscriptionFn(newAccounts);
      }
      if (options.subscriptionCallback) {
        options.subscriptionCallback(newAccounts);
      }
    },
  };
};

/**
 * Mock factory for creating NetworkInfo instances
 */
export const createMockNetworkInfo = (
  id: string,
  options: {
    name?: string;
    providers?: string[];
    decimals?: number;
    symbol?: string;
    jsonRpcApi?: JsonRpcApi;
    type?: NetworkType;
    chainSpec?: () => Promise<string>;
    relayChain?: NetworkInfo;
  } = {}
): NetworkInfo => ({
  id,
  name: options.name || `Mock Network ${id}`,
  providers: options.providers || [`wss://${id}.api.test`],
  decimals: options.decimals || 12,
  logo: '',
  symbol: options.symbol || id.toUpperCase(),
  jsonRpcApi: options.jsonRpcApi,
  type: options.type,
  chainSpec: options.chainSpec,
  relayChain: options.relayChain,
});

/**
 * Mock factory for creating Substrate client instances
 */
export const createMockSubstrateClient = (
  networkId: string,
  options: {
    disconnectError?: Error;
    setSigner?: ReturnType<typeof vi.fn>;
  } = {}
): CompatibleSubstrateApi => ({
  disconnect: vi.fn().mockImplementation(async () => {
    if (options.disconnectError) {
      throw options.disconnectError;
    }
  }),
  setSigner: options.setSigner || vi.fn(),
  _networkId: networkId, // For testing identification
} as any);

/**
 * Mock factory for creating WalletConnection instances
 */
export const createMockWalletConnection = (
  walletId: string,
  accounts: TypinkAccount[],
  options: {
    wallet?: Wallet;
    signer?: InjectedSigner;
    subscription?: () => void;
  } = {}
): WalletConnection => ({
  walletId,
  wallet: options.wallet || createMockWallet(walletId),
  signer: options.signer || createMockSigner(walletId),
  accounts,
  subscription: options.subscription || vi.fn(),
});

/**
 * Mock factory for creating Smoldot client instances
 */
export const createMockSmoldotClient = () => ({
  addChain: vi.fn().mockResolvedValue(createMockSmoldotChain()),
});

/**
 * Mock factory for creating Smoldot chain instances  
 */
export const createMockSmoldotChain = () => ({
  remove: vi.fn().mockResolvedValue(undefined),
});

/**
 * Predefined test network configurations
 */
export const TEST_NETWORKS = {
  POLKADOT: createMockNetworkInfo('polkadot', {
    name: 'Polkadot',
    symbol: 'DOT',
    decimals: 10,
    providers: ['wss://polkadot.api.test'],
  }),
  
  KUSAMA: createMockNetworkInfo('kusama', {
    name: 'Kusama', 
    symbol: 'KSM',
    decimals: 12,
    providers: ['wss://kusama.api.test'],
  }),
  
  WESTEND: createMockNetworkInfo('westend', {
    name: 'Westend',
    symbol: 'WND', 
    decimals: 12,
    providers: ['wss://westend.api.test'],
    jsonRpcApi: JsonRpcApi.LEGACY,
  }),
  
  LIGHT_CHAIN: createMockNetworkInfo('light-chain', {
    name: 'Light Chain',
    symbol: 'LIGHT',
    decimals: 12,
    providers: ['wss://light.api.test'],
    chainSpec: vi.fn().mockResolvedValue('mock-chain-spec'),
  }),
  
  PARA_CHAIN: createMockNetworkInfo('para-chain', {
    name: 'Para Chain',
    symbol: 'PARA',
    decimals: 12,
    providers: ['wss://para.api.test'],
    chainSpec: vi.fn().mockResolvedValue('mock-para-chain-spec'),
    relayChain: createMockNetworkInfo('relay-chain', {
      name: 'Relay Chain',
      symbol: 'RELAY', 
      decimals: 12,
      providers: ['wss://relay.api.test'],
      chainSpec: vi.fn().mockResolvedValue('mock-relay-chain-spec'),
    }),
  }),
};

/**
 * Predefined test accounts
 */
export const TEST_ACCOUNTS = {
  ALICE: createMockTypinkAccount('5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY', 'polkadot-js', 'Alice'),
  BOB: createMockTypinkAccount('5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty', 'polkadot-js', 'Bob'),
  CHARLIE: createMockTypinkAccount('5Ff3iXP75ruzrDB9N3MultVw3pX9vLEEnyNaHyNaKoVKMc82', 'talisman', 'Charlie'),
  DAVE: createMockTypinkAccount('5DAAnrj7VHTznn2AWBemMuyBwZWs6FNFjdyVXUeYum3PTXFy', 'subwallet', 'Dave'),
};

/**
 * Predefined test wallets
 */
export const TEST_WALLETS = {
  POLKADOT_JS: createMockWallet('polkadot-js', { name: 'Polkadot{.js}' }),
  TALISMAN: createMockWallet('talisman', { name: 'Talisman' }),
  SUBWALLET: createMockWallet('subwallet', { name: 'SubWallet' }),
};

/**
 * Test utility to wait for async operations
 */
export const waitForAsync = (ms: number = 0) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Test utility to setup a complete wallet connection scenario
 */
export const setupWalletConnectionScenario = (
  store: ReturnType<typeof createTestStore>,
  options: {
    walletId: string;
    accounts: TypinkAccount[];
    connectedAccount?: TypinkAccount;
    appName?: string;
  }
) => {
  const { walletId, accounts, connectedAccount, appName = 'Test DApp' } = options;
  
  const injectedAccounts = accounts.map(acc => 
    createMockInjectedAccount(acc.address, acc.name)
  );
  
  const provider = createMockInjectedProvider(injectedAccounts);
  const wallet = createMockWallet(walletId, { injectedProvider: provider });
  
  return {
    wallet,
    provider,
    injectedAccounts,
    setup: async () => {
      const { initializeWalletsAtom, initializeAppNameAtom, connectWalletAtom, setConnectedAccountAtom } = 
        await import('../walletActions.js');
      
      store.set(initializeWalletsAtom, [wallet]);
      store.set(initializeAppNameAtom, appName);
      await store.set(connectWalletAtom, walletId);
      
      if (connectedAccount) {
        store.set(setConnectedAccountAtom, connectedAccount);
      }
      
      return { wallet, provider };
    }
  };
};

/**
 * Test utility to setup a complete network client scenario
 */
export const setupNetworkClientScenario = (
  store: ReturnType<typeof createTestStore>,
  options: {
    networks: NetworkInfo[];
    connections: { networkId: string; provider?: string }[];
    cacheMetadata?: boolean;
  }
) => {
  const { networks, connections, cacheMetadata = false } = options;
  
  const clients = new Map();
  connections.forEach(conn => {
    clients.set(conn.networkId, createMockSubstrateClient(conn.networkId));
  });
  
  return {
    clients,
    setup: async () => {
      const { 
        initializeSupportedNetworksAtom, 
        initializeCacheMetadataAtom,
        initializeClientsAtom 
      } = await import('../clientActions.js');
      const { networkConnectionsAtom } = await import('../clientAtoms.js');
      
      store.set(initializeSupportedNetworksAtom, networks);
      store.set(initializeCacheMetadataAtom, cacheMetadata);
      store.set(networkConnectionsAtom, connections);
      
      // Mock the client creation
      const mockClients = Array.from(clients.values());
      const { DedotClient, LegacyClient } = vi.mocked(await import('dedot'));
      
      let clientIndex = 0;
      DedotClient.new.mockImplementation(() => Promise.resolve(mockClients[clientIndex++]));
      LegacyClient.new.mockImplementation(() => Promise.resolve(mockClients[clientIndex++]));
      
      await store.set(initializeClientsAtom, undefined);
      
      return { clients };
    }
  };
};

/**
 * Global test setup helper that mocks all external dependencies
 */
export const setupGlobalMocks = () => {
  // Mock transformInjectedToTypinkAccounts utility
  vi.mock('../../utils/index.js', () => ({
    transformInjectedToTypinkAccounts: vi.fn((injectedAccounts, walletId) =>
      injectedAccounts.map((acc: any) => ({
        address: acc.address,
        source: walletId,
        name: acc.name,
      }))
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

  // Mock dedot client libraries
  vi.mock('dedot', () => ({
    DedotClient: {
      new: vi.fn(),
    },
    LegacyClient: {
      new: vi.fn(),
    },
    WsProvider: vi.fn(),
    SmoldotProvider: vi.fn(),
  }));

  // Mock smoldot worker
  vi.mock('dedot/smoldot/with-worker', () => ({
    startWithWorker: vi.fn(),
  }));
};

/**
 * Type helpers for better test typing
 */
export type MockStore = ReturnType<typeof createTestStore>;
export type MockWallet = ReturnType<typeof createMockWallet>;
export type MockProvider = ReturnType<typeof createMockInjectedProvider>;
export type MockClient = ReturnType<typeof createMockSubstrateClient>;