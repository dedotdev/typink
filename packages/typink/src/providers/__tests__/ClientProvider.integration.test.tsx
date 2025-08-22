import { beforeEach, describe, expect, it } from 'vitest';
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
    // Clear localStorage to ensure clean state
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear();
    }
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
          { networkId: 'secondary-network', provider: 'wss://custom.api' },
        ]),
      ).not.toThrow();

      // Should handle single network
      expect(() => result.current.setNetworks(['test-network'])).not.toThrow();
    });
  });
});
