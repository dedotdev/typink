import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { ClientProvider, useClient } from '../ClientProvider.js';
import { NetworkInfo } from '../../types.js';
import React from 'react';
import { createStore, Provider } from 'jotai';

describe('ClientProvider Integration Tests', () => {
  let store: ReturnType<typeof createStore>;

  const mockNetworks: NetworkInfo[] = [
    {
      id: 'test-network',
      name: 'Test Network',
      providers: ['ws://localhost:9944'],
      decimals: 10,
      logo: '',
      symbol: 'TEST',
    },
    {
      id: 'secondary-network',
      name: 'Secondary Network',
      providers: ['ws://localhost:9945'],
      decimals: 12,
      logo: '',
      symbol: 'SEC',
    },
  ];

  beforeEach(() => {
    // Create fresh store for each test
    store = createStore();

    // Mock console methods to suppress expected error messages
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    // Clear localStorage to ensure clean state
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear();
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Single Client Mode (Backward Compatibility)', () => {
    it('should provide client context with single network', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>
          <ClientProvider defaultNetworkIds={['test-network']} supportedNetworks={mockNetworks}>
            {children}
          </ClientProvider>
        </Provider>
      );

      const { result } = renderHook(() => useClient(), { wrapper });

      // Basic properties should be available
      expect(result.current.network.id).toBe('test-network');
      expect(result.current.networks).toHaveLength(1);
      expect(result.current.networks[0].id).toBe('test-network');
      expect(result.current.supportedNetworks).toEqual(mockNetworks);

      // Functions should be defined
      expect(result.current.setNetwork).toBeDefined();
      expect(result.current.setNetworks).toBeDefined();
      expect(result.current.getClient).toBeDefined();
    });

    it('should allow network switching', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>
          <ClientProvider defaultNetworkIds={['test-network']} supportedNetworks={mockNetworks}>
            {children}
          </ClientProvider>
        </Provider>
      );

      const { result } = renderHook(() => useClient(), { wrapper });

      expect(result.current.network.id).toBe('test-network');

      // Note: In a real test, network switching would require proper atom state management
      // This test verifies the function exists and can be called
      expect(() => result.current.setNetwork('secondary-network')).not.toThrow();
    });
  });

  describe('Multi-Client Mode', () => {
    it('should support multiple networks', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>
          <ClientProvider defaultNetworkIds={['test-network', 'secondary-network']} supportedNetworks={mockNetworks}>
            {children}
          </ClientProvider>
        </Provider>
      );

      const { result } = renderHook(() => useClient(), { wrapper });

      // Should have primary network set
      expect(result.current.network.id).toBe('test-network');

      // Should have all networks configured
      expect(result.current.networks).toHaveLength(2);
      expect(result.current.networks[0].id).toBe('test-network');
      expect(result.current.networks[1].id).toBe('secondary-network');

      // Multi-client properties should be available
      expect(result.current.clients).toBeDefined();
      expect(result.current.clients instanceof Map).toBe(true);
      expect(result.current.setNetworks).toBeDefined();
    });

    it('should provide getClient helper function', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>
          <ClientProvider defaultNetworkIds={['test-network', 'secondary-network']} supportedNetworks={mockNetworks}>
            {children}
          </ClientProvider>
        </Provider>
      );

      const { result } = renderHook(() => useClient(), { wrapper });

      // getClient should be a function
      expect(typeof result.current.getClient).toBe('function');

      // Should handle various inputs gracefully
      expect(() => result.current.getClient()).not.toThrow();
      expect(() => result.current.getClient('test-network')).not.toThrow();
      expect(() => result.current.getClient('non-existent')).not.toThrow();
    });

    it('should validate network IDs', () => {
      // This should throw an error for invalid network
      expect(() => {
        renderHook(() => useClient(), {
          wrapper: ({ children }: { children: React.ReactNode }) => (
            <Provider store={store}>
              <ClientProvider defaultNetworkIds={['test-network', 'invalid-network']} supportedNetworks={mockNetworks}>
                {children}
              </ClientProvider>
            </Provider>
          ),
        });
      }).toThrow("Network ID 'invalid-network' not found in supported networks");
    });
  });

  describe('Empty Configuration', () => {
    it('should work with minimal configuration', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>
          <ClientProvider supportedNetworks={[mockNetworks[0]]}>{children}</ClientProvider>
        </Provider>
      );

      const { result } = renderHook(() => useClient(), { wrapper });

      // Should default to first network
      expect(result.current.network.id).toBe('test-network');
      expect(result.current.networks).toHaveLength(1);
    });

    it('should handle single network configuration', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>
          <ClientProvider defaultNetworkIds={['test-network']} supportedNetworks={mockNetworks}>
            {children}
          </ClientProvider>
        </Provider>
      );

      const { result } = renderHook(() => useClient(), { wrapper });

      expect(result.current.network.id).toBe('test-network');
      expect(result.current.networks).toHaveLength(1);
      expect(result.current.clients).toBeDefined();
    });

    it('should support batch network updates', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>
          <ClientProvider defaultNetworkIds={['test-network']} supportedNetworks={mockNetworks}>
            {children}
          </ClientProvider>
        </Provider>
      );

      const { result } = renderHook(() => useClient(), { wrapper });

      // setNetworks should be a function
      expect(typeof result.current.setNetworks).toBe('function');

      // Should handle NetworkId array
      expect(() => result.current.setNetworks(['test-network', 'secondary-network'])).not.toThrow();

      // Should handle NetworkConnection array
      expect(() =>
        result.current.setNetworks([
          { networkId: 'test-network' },
          { networkId: 'secondary-network', provider: 'wss://custom.api' as const },
        ]),
      ).not.toThrow();

      // Should handle single network
      expect(() => result.current.setNetworks(['test-network'])).not.toThrow();
    });
  });

  describe('Atom State Management', () => {
    it('should initialize atoms with correct values', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>
          <ClientProvider defaultNetworkIds={['test-network']} supportedNetworks={mockNetworks} cacheMetadata={true}>
            {children}
          </ClientProvider>
        </Provider>
      );

      const { result } = renderHook(() => useClient(), { wrapper });

      expect(result.current.supportedNetworks).toEqual(mockNetworks);
      expect(result.current.cacheMetadata).toBe(true);
      expect(result.current.networkConnections).toEqual([{ networkId: 'test-network' }]);
    });

    it('should handle cache metadata disabled', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>
          <ClientProvider defaultNetworkIds={['test-network']} supportedNetworks={mockNetworks} cacheMetadata={false}>
            {children}
          </ClientProvider>
        </Provider>
      );

      const { result } = renderHook(() => useClient(), { wrapper });

      expect(result.current.cacheMetadata).toBe(false);
    });

    it('should handle undefined cache metadata (default to false)', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>
          <ClientProvider defaultNetworkIds={['test-network']} supportedNetworks={mockNetworks}>
            {children}
          </ClientProvider>
        </Provider>
      );

      const { result } = renderHook(() => useClient(), { wrapper });

      expect(result.current.cacheMetadata).toBe(false);
    });
  });

  describe('Network Connection Priority', () => {
    it('should prioritize defaultNetworkIds over defaultNetworkId', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>
          <ClientProvider
            defaultNetworkIds={['test-network', 'secondary-network']}
            defaultNetworkId={'secondary-network'} // This should be ignored
            supportedNetworks={mockNetworks}>
            {children}
          </ClientProvider>
        </Provider>
      );

      const { result } = renderHook(() => useClient(), { wrapper });

      expect(result.current.network.id).toBe('test-network');
      expect(result.current.networks).toHaveLength(2);
      expect(result.current.networks[0].id).toBe('test-network');
      expect(result.current.networks[1].id).toBe('secondary-network');
    });

    it('should use defaultNetworkId when defaultNetworkIds is not provided', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>
          <ClientProvider defaultNetworkId={'secondary-network'} supportedNetworks={mockNetworks}>
            {children}
          </ClientProvider>
        </Provider>
      );

      const { result } = renderHook(() => useClient(), { wrapper });

      expect(result.current.network.id).toBe('secondary-network');
      expect(result.current.networks).toHaveLength(1);
      expect(result.current.networks[0].id).toBe('secondary-network');
    });

    it('should default to first supported network when no defaults provided', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>
          <ClientProvider supportedNetworks={mockNetworks}>{children}</ClientProvider>
        </Provider>
      );

      const { result } = renderHook(() => useClient(), { wrapper });

      expect(result.current.network.id).toBe('test-network');
      expect(result.current.networks).toHaveLength(1);
    });
  });

  describe('NetworkConnection Object Support', () => {
    it('should handle NetworkConnection objects in defaultNetworkIds', () => {
      const networkConnections = [
        { networkId: 'test-network', provider: 'wss://custom.provider' as const },
        { networkId: 'secondary-network' },
      ];

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>
          <ClientProvider defaultNetworkIds={networkConnections} supportedNetworks={mockNetworks}>
            {children}
          </ClientProvider>
        </Provider>
      );

      const { result } = renderHook(() => useClient(), { wrapper });

      expect(result.current.networkConnections).toEqual(networkConnections);
      expect(result.current.networkConnection.provider).toBe('wss://custom.provider');
    });

    it('should handle NetworkConnection object in defaultNetworkId', () => {
      const networkConnection = { networkId: 'secondary-network', provider: 'wss://custom.secondary' as const };

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>
          <ClientProvider defaultNetworkId={networkConnection} supportedNetworks={mockNetworks}>
            {children}
          </ClientProvider>
        </Provider>
      );

      const { result } = renderHook(() => useClient(), { wrapper });

      expect(result.current.networkConnection).toEqual(networkConnection);
    });

    it('should handle mixed string and NetworkConnection in defaultNetworkIds', () => {
      const mixedConnections = [
        'test-network',
        { networkId: 'secondary-network', provider: 'wss://custom.provider' as const },
      ];

      const expectedConnections = [
        { networkId: 'test-network' },
        { networkId: 'secondary-network', provider: 'wss://custom.provider' as const },
      ];

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>
          <ClientProvider defaultNetworkIds={mixedConnections} supportedNetworks={mockNetworks}>
            {children}
          </ClientProvider>
        </Provider>
      );

      const { result } = renderHook(() => useClient(), { wrapper });

      expect(result.current.networkConnections).toEqual(expectedConnections);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should throw error for empty supported networks', () => {
      expect(() => {
        renderHook(() => useClient(), {
          wrapper: ({ children }: { children: React.ReactNode }) => (
            <Provider store={store}>
              <ClientProvider supportedNetworks={[]}>{children}</ClientProvider>
            </Provider>
          ),
        });
      }).toThrow('Required at least one supported network');
    });

    it('should validate all network IDs in defaultNetworkIds', () => {
      expect(() => {
        renderHook(() => useClient(), {
          wrapper: ({ children }: { children: React.ReactNode }) => (
            <Provider store={store}>
              <ClientProvider
                defaultNetworkIds={['test-network', 'invalid-network-1', 'invalid-network-2']}
                supportedNetworks={mockNetworks}>
                {children}
              </ClientProvider>
            </Provider>
          ),
        });
      }).toThrow("Network ID 'invalid-network-1' not found in supported networks");
    });

    it('should handle empty defaultNetworkIds array', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>
          <ClientProvider defaultNetworkIds={[]} supportedNetworks={mockNetworks}>
            {children}
          </ClientProvider>
        </Provider>
      );

      const { result } = renderHook(() => useClient(), { wrapper });

      // Should default to first supported network
      expect(result.current.network.id).toBe('test-network');
    });

    it('should handle provider key changes', () => {
      const connections1 = [{ networkId: 'test-network' }];
      const connections2 = [{ networkId: 'secondary-network' }];

      // Create separate stores for isolated testing
      const store1 = createStore();
      const store2 = createStore();

      const wrapper1 = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store1}>
          <ClientProvider key='provider-test-network' defaultNetworkIds={connections1} supportedNetworks={mockNetworks}>
            {children}
          </ClientProvider>
        </Provider>
      );

      const wrapper2 = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store2}>
          <ClientProvider
            key='provider-secondary-network'
            defaultNetworkIds={connections2}
            supportedNetworks={mockNetworks}>
            {children}
          </ClientProvider>
        </Provider>
      );

      const { result: result1 } = renderHook(() => useClient(), { wrapper: wrapper1 });
      const { result: result2 } = renderHook(() => useClient(), { wrapper: wrapper2 });

      expect(result1.current.network.id).toBe('test-network');
      expect(result2.current.network.id).toBe('secondary-network');
    });
  });

  describe('Client Lifecycle Management', () => {
    it('should provide ready state', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>
          <ClientProvider defaultNetworkIds={['test-network']} supportedNetworks={mockNetworks}>
            {children}
          </ClientProvider>
        </Provider>
      );

      const { result } = renderHook(() => useClient(), { wrapper });

      expect(typeof result.current.ready).toBe('boolean');
    });

    it('should provide clients map', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>
          <ClientProvider defaultNetworkIds={['test-network', 'secondary-network']} supportedNetworks={mockNetworks}>
            {children}
          </ClientProvider>
        </Provider>
      );

      const { result } = renderHook(() => useClient(), { wrapper });

      expect(result.current.clients).toBeInstanceOf(Map);
    });

    it('should handle client not found in getClient', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>
          <ClientProvider defaultNetworkIds={['test-network']} supportedNetworks={mockNetworks}>
            {children}
          </ClientProvider>
        </Provider>
      );

      const { result } = renderHook(() => useClient(), { wrapper });

      const nonExistentClient = result.current.getClient('non-existent-network');
      expect(nonExistentClient).toBeUndefined();
    });

    it('should return primary client when getClient called without networkId', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>
          <ClientProvider defaultNetworkIds={['test-network']} supportedNetworks={mockNetworks}>
            {children}
          </ClientProvider>
        </Provider>
      );

      const { result } = renderHook(() => useClient(), { wrapper });

      const primaryClient = result.current.getClient();
      expect(primaryClient).toBe(result.current.client);
    });
  });

  describe('Backward Compatibility', () => {
    it('should maintain single client interface for backward compatibility', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>
          <ClientProvider defaultNetworkIds={['test-network']} supportedNetworks={mockNetworks}>
            {children}
          </ClientProvider>
        </Provider>
      );

      const { result } = renderHook(() => useClient(), { wrapper });

      // Should provide primary network and connection info for single-client usage
      expect(result.current.network).toBeDefined();
      expect(result.current.network.id).toBe('test-network');
      expect(result.current.networkConnection).toBeDefined();
      expect(result.current.networkConnection.networkId).toBe('test-network');
    });
  });

  describe('Context Provider Key Strategy', () => {
    it('should use network connections in provider key', () => {
      const connections1 = [{ networkId: 'test-network' }];
      const connections2 = [{ networkId: 'secondary-network' }];

      // Create separate stores for isolated testing
      const store1 = createStore();
      const store2 = createStore();

      const wrapper1 = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store1}>
          <ClientProvider defaultNetworkIds={connections1} supportedNetworks={mockNetworks}>
            {children}
          </ClientProvider>
        </Provider>
      );

      const wrapper2 = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store2}>
          <ClientProvider defaultNetworkIds={connections2} supportedNetworks={mockNetworks}>
            {children}
          </ClientProvider>
        </Provider>
      );

      const { result: result1 } = renderHook(() => useClient(), { wrapper: wrapper1 });
      const { result: result2 } = renderHook(() => useClient(), { wrapper: wrapper2 });

      expect(result1.current.network.id).toBe('test-network');
      expect(result2.current.network.id).toBe('secondary-network');
    });

    it('should handle complex network connection changes', () => {
      const initialConnections = [
        { networkId: 'test-network' },
        { networkId: 'secondary-network', provider: 'wss://custom.provider' as const },
      ];

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>
          <ClientProvider defaultNetworkIds={initialConnections} supportedNetworks={mockNetworks}>
            {children}
          </ClientProvider>
        </Provider>
      );

      const { result } = renderHook(() => useClient(), { wrapper });

      expect(result.current.networks).toHaveLength(2);
      expect(result.current.networkConnections).toEqual(initialConnections);
    });
  });

  describe('Props Validation and Normalization', () => {
    it('should normalize string networkIds to NetworkConnection objects', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>
          <ClientProvider defaultNetworkIds={['test-network', 'secondary-network']} supportedNetworks={mockNetworks}>
            {children}
          </ClientProvider>
        </Provider>
      );

      const { result } = renderHook(() => useClient(), { wrapper });

      const expectedConnections = [{ networkId: 'test-network' }, { networkId: 'secondary-network' }];

      expect(result.current.networkConnections).toEqual(expectedConnections);
    });

    it('should preserve NetworkConnection objects as-is', () => {
      const networkConnections = [
        { networkId: 'test-network', provider: 'wss://custom1.provider' as const },
        { networkId: 'secondary-network', provider: 'wss://custom2.provider' as const },
      ];

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>
          <ClientProvider defaultNetworkIds={networkConnections} supportedNetworks={mockNetworks}>
            {children}
          </ClientProvider>
        </Provider>
      );

      const { result } = renderHook(() => useClient(), { wrapper });

      expect(result.current.networkConnections).toEqual(networkConnections);
    });

    it('should handle defaultNetworkIds with duplicate network IDs', () => {
      const duplicateConnections = [
        { networkId: 'test-network', provider: 'wss://provider1' as const },
        { networkId: 'test-network', provider: 'wss://provider2' as const },
      ];

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>
          <ClientProvider defaultNetworkIds={duplicateConnections} supportedNetworks={mockNetworks}>
            {children}
          </ClientProvider>
        </Provider>
      );

      const { result } = renderHook(() => useClient(), { wrapper });

      // Should accept duplicate network IDs (second one might override first in clients map)
      expect(result.current.networkConnections).toEqual(duplicateConnections);
      expect(result.current.networks).toHaveLength(2);
    });
  });
});
