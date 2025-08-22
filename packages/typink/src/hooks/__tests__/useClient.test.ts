import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ClientContextProps, useClient } from '../../providers/ClientProvider.js';
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

const mockContextValue: ClientContextProps = {
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
};

describe('useClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Setup the mock to return our context value
    vi.mocked(React.useContext).mockReturnValue(mockContextValue);
  });

  it('should return client context with default SubstrateApi type', () => {
    const result = useClient();

    expect(result).toEqual(mockContextValue);
    expect(result.client).toBe(mockClient);
    expect(result.ready).toBe(true);
  });

  it('should return client context with PolkadotApi type', () => {
    const result = useClient<PolkadotApi>();

    expect(result).toEqual(mockContextValue);
    expect(result.client).toBe(mockClient);
    expect(result.ready).toBe(true);
  });

  it('should handle undefined client', () => {
    const contextWithoutClient = {
      ...mockContextValue,
      client: undefined,
      ready: false,
    };

    vi.mocked(React.useContext).mockReturnValue(contextWithoutClient);

    const result = useClient();

    expect(result.client).toBeUndefined();
    expect(result.ready).toBe(false);
  });

  // Type-level tests using TypeScript's type checking
  it('should have correct return types', () => {
    const result = useClient();

    // These type assertions will fail at compile time if types are wrong
    type ClientType = typeof result.client;
    type ReadyType = typeof result.ready;
    type NetworkType = typeof result.network;

    // Verify the properties exist and have expected types
    expect(typeof result.ready).toBe('boolean');
    expect(typeof result.network.id).toBe('string');
    expect(typeof result.setNetwork).toBe('function');
    expect(Array.isArray(result.supportedNetworks)).toBe(true);
  });

  it('should have correct return types with generic PolkadotApi', () => {
    const result = useClient<PolkadotApi>();

    // Type assertion - this will fail at compile time if generic typing is wrong
    const clientContext: ClientContextProps<PolkadotApi> = result;

    expect(clientContext).toEqual(mockContextValue);
    expect(typeof clientContext.ready).toBe('boolean');
    expect(typeof clientContext.network.id).toBe('string');
  });

  it('should maintain type safety across different ChainApi types', () => {
    // Test with default SubstrateApi
    const defaultResult = useClient();

    // Test with PolkadotApi
    const polkadotResult = useClient<PolkadotApi>();

    // Both should have the same runtime properties
    expect(defaultResult.ready).toBe(polkadotResult.ready);
    expect(defaultResult.network.id).toBe(polkadotResult.network.id);
    expect(defaultResult.client).toBe(polkadotResult.client);

    // Type-level verification that both are valid ClientContextProps
    const defaultContext: ClientContextProps = defaultResult;
    const polkadotContext: ClientContextProps<PolkadotApi> = polkadotResult;

    expect(defaultContext).toBeDefined();
    expect(polkadotContext).toBeDefined();
  });

  it('should properly cast context value with generic type', () => {
    // Test that the hook properly casts the context value
    const result = useClient<PolkadotApi>();

    // Verify that useContext was called
    expect(React.useContext).toHaveBeenCalled();

    // The result should be the same as our mock context value
    expect(result).toBe(mockContextValue);
  });
});
