import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useTypink } from '../useTypink.js';
import { TypinkContextProps } from '../../providers/TypinkProvider.js';
import { PolkadotApi } from '@dedot/chaintypes';
import * as React from 'react';

// Mock useContext to return our mock values
vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    useContext: vi.fn(),
  };
});

// Mock client for testing
const mockClient = {
  query: {},
  tx: {},
  call: {},
  rpc: {},
  disconnect: vi.fn(),
} as any;

const mockTypinkContextValue: TypinkContextProps = {
  // ClientContextProps
  client: mockClient,
  ready: true,
  supportedNetworks: [],
  network: { id: 'test', name: 'Test Network', providers: [], decimals: 10, logo: '', symbol: 'UNIT' },
  networkConnection: { networkId: 'test' },
  networks: [{ id: 'test', name: 'Test Network', providers: [], decimals: 10, logo: '', symbol: 'UNIT' }],
  networkConnections: [{ networkId: 'test' }],
  clients: new Map(),
  setNetwork: vi.fn(),
  setNetworks: vi.fn(),
  getClient: vi.fn(),
  cacheMetadata: false,

  // WalletSetupContextProps
  signer: undefined,
  connectedAccount: undefined,
  wallets: [],

  // Multi-wallet support
  accounts: [],
  connectWallet: vi.fn(),
  disconnect: vi.fn(),
  connectedWalletIds: [],
  connectedWallets: [],
  setConnectedAccount: vi.fn(),

  appName: '',

  // TypinkEventsContextProps
  subscribeToEvent: vi.fn(),

  // TypinkContextProps specific
  deployments: [
    {
      address: 'mock-address',
      metadata: {} as any,
      network: 'test',
      id: 'test',
    },
  ],
  defaultCaller: 'default-caller-address' as any,
};

describe('useTypink', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Setup the mock to return our context value
    vi.mocked(React.useContext).mockReturnValue(mockTypinkContextValue);
  });

  it('should return full Typink context with default SubstrateApi type', () => {
    const result = useTypink();

    expect(result).toEqual(mockTypinkContextValue);
    expect(result.client).toBe(mockClient);
    expect(result.ready).toBe(true);
    expect(result.deployments).toHaveLength(1);
    expect(result.defaultCaller).toBe('default-caller-address');
  });

  it('should return full Typink context with PolkadotApi type', () => {
    const result = useTypink<PolkadotApi>();

    expect(result).toEqual(mockTypinkContextValue);
    expect(result.client).toBe(mockClient);
    expect(result.ready).toBe(true);
    expect(result.deployments).toHaveLength(1);
    expect(result.defaultCaller).toBe('default-caller-address');
  });

  it('should handle context without client', () => {
    const contextWithoutClient = {
      ...mockTypinkContextValue,
      client: undefined,
      ready: false,
    };

    vi.mocked(React.useContext).mockReturnValue(contextWithoutClient);

    const result = useTypink();

    expect(result.client).toBeUndefined();
    expect(result.ready).toBe(false);
    expect(result.deployments).toHaveLength(1);
    expect(result.defaultCaller).toBe('default-caller-address');
  });

  it('should have all required context properties', () => {
    const result = useTypink();

    // ClientContextProps properties
    expect(result).toHaveProperty('client');
    expect(result).toHaveProperty('ready');
    expect(result).toHaveProperty('supportedNetworks');
    expect(result).toHaveProperty('network');
    expect(result).toHaveProperty('networkConnection');
    expect(result).toHaveProperty('networks');
    expect(result).toHaveProperty('networkConnections');
    expect(result).toHaveProperty('clients');
    expect(result).toHaveProperty('setNetwork');
    expect(result).toHaveProperty('setNetworks');
    expect(result).toHaveProperty('getClient');
    expect(result).toHaveProperty('cacheMetadata');

    // WalletSetupContextProps properties
    expect(result).toHaveProperty('signer');
    expect(result).toHaveProperty('connectedAccount');
    expect(result).toHaveProperty('wallets');

    // Multi-wallet properties
    expect(result).toHaveProperty('accounts');
    expect(result).toHaveProperty('connectWallet');
    expect(result).toHaveProperty('disconnect');
    expect(result).toHaveProperty('connectedWalletIds');
    expect(result).toHaveProperty('connectedWallets');

    // TypinkEventsContextProps properties
    expect(result).toHaveProperty('subscribeToEvent');

    // TypinkContextProps specific properties
    expect(result).toHaveProperty('deployments');
    expect(result).toHaveProperty('defaultCaller');
  });

  it('should have correct property types', () => {
    const result = useTypink();

    // Type assertions for primitive types
    expect(typeof result.ready).toBe('boolean');
    expect(typeof result.network.id).toBe('string');
    expect(typeof result.defaultCaller).toBe('string');

    // Type assertions for function types
    expect(typeof result.setNetwork).toBe('function');
    expect(typeof result.setNetworks).toBe('function');
    expect(typeof result.getClient).toBe('function');
    expect(typeof result.connectWallet).toBe('function');
    expect(typeof result.disconnect).toBe('function');
    expect(typeof result.subscribeToEvent).toBe('function');

    // Type assertions for array types
    expect(Array.isArray(result.supportedNetworks)).toBe(true);
    expect(Array.isArray(result.accounts)).toBe(true);
    expect(Array.isArray(result.deployments)).toBe(true);
    expect(Array.isArray(result.wallets)).toBe(true);
    expect(Array.isArray(result.connectedWalletIds)).toBe(true);
    expect(Array.isArray(result.connectedWallets)).toBe(true);
  });

  it('should have correct return types with generic PolkadotApi', () => {
    const result = useTypink<PolkadotApi>();

    // Type assertion - this will fail at compile time if generic typing is wrong
    const typinkContext: TypinkContextProps<PolkadotApi> = result;

    expect(typinkContext).toEqual(mockTypinkContextValue);
    expect(typeof typinkContext.ready).toBe('boolean');
    expect(typeof typinkContext.network.id).toBe('string');
    expect(typeof typinkContext.defaultCaller).toBe('string');
    expect(Array.isArray(typinkContext.deployments)).toBe(true);
  });

  it('should maintain type safety across different ChainApi types', () => {
    // Test with default SubstrateApi
    const defaultResult = useTypink();

    // Test with PolkadotApi
    const polkadotResult = useTypink<PolkadotApi>();

    // Both should have the same runtime properties
    expect(defaultResult.ready).toBe(polkadotResult.ready);
    expect(defaultResult.network.id).toBe(polkadotResult.network.id);
    expect(defaultResult.client).toBe(polkadotResult.client);
    expect(defaultResult.deployments).toEqual(polkadotResult.deployments);
    expect(defaultResult.defaultCaller).toBe(polkadotResult.defaultCaller);

    // Type-level verification that both are valid TypinkContextProps
    const defaultContext: TypinkContextProps = defaultResult;
    const polkadotContext: TypinkContextProps<PolkadotApi> = polkadotResult;

    expect(defaultContext).toBeDefined();
    expect(polkadotContext).toBeDefined();
  });

  it('should handle empty deployments array', () => {
    const contextWithEmptyDeployments = {
      ...mockTypinkContextValue,
      deployments: [],
    };

    vi.mocked(React.useContext).mockReturnValue(contextWithEmptyDeployments);

    const result = useTypink();

    expect(result.deployments).toHaveLength(0);
    expect(Array.isArray(result.deployments)).toBe(true);
  });

  it('should properly type client as CompatibleSubstrateApi when using generics', () => {
    const result = useTypink<PolkadotApi>();

    // The client should be defined and have the expected structure
    expect(result.client).toBeDefined();

    if (result.client) {
      // These properties should exist on any substrate client
      expect(result.client).toHaveProperty('query');
      expect(result.client).toHaveProperty('tx');
      expect(result.client).toHaveProperty('call');
      expect(result.client).toHaveProperty('rpc');
    }
  });

  it('should properly cast context value with generic type', () => {
    // Test that the hook properly casts the context value
    const result = useTypink<PolkadotApi>();

    // Verify that useContext was called
    expect(React.useContext).toHaveBeenCalled();

    // The result should be the same as our mock context value
    expect(result).toBe(mockTypinkContextValue);
  });
});
