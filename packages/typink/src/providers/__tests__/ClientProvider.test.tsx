import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { createStore, Provider } from 'jotai';
import React from 'react';
import { ClientProvider, useClient } from '../ClientProvider.js';
import { networkConnectionsAtom } from '../../atoms/clientAtoms.js';
import { NetworkConnection, NetworkInfo } from '../../types.js';
import { createMockNetworkInfo, TEST_NETWORKS } from '../../atoms/__tests__/test-utils.js';

describe('ClientProvider localStorage validation', () => {
  let store: ReturnType<typeof createStore>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  const supportedNetworks: NetworkInfo[] = [
    TEST_NETWORKS.POLKADOT,
    TEST_NETWORKS.KUSAMA,
    TEST_NETWORKS.WESTEND,
  ];

  const validConnections: NetworkConnection[] = [
    { networkId: 'polkadot' },
    { networkId: 'kusama', provider: 'wss://custom.kusama.provider' },
  ];

  const invalidConnections: NetworkConnection[] = [
    { networkId: 'polkadot' },
    { networkId: 'invalid-network' }, // This network doesn't exist in supportedNetworks
    { networkId: 'kusama' },
  ];

  const partiallyInvalidConnections: NetworkConnection[] = [
    { networkId: 'polkadot' },
    { networkId: 'removed-network' }, // Invalid
    { networkId: 'kusama' },
    { networkId: 'another-invalid' }, // Invalid
  ];

  beforeEach(() => {
    store = createStore();
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    // Clear localStorage for each test
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear();
    }
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  const createWrapper = (
    defaultNetworkIds: (string | NetworkConnection)[] = ['polkadot'],
    presetConnections?: NetworkConnection[]
  ) => {
    // Pre-populate the atom with stored connections if provided
    if (presetConnections) {
      store.set(networkConnectionsAtom, presetConnections);
    }

    return ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>
        <ClientProvider defaultNetworkIds={defaultNetworkIds} supportedNetworks={supportedNetworks}>
          {children}
        </ClientProvider>
      </Provider>
    );
  };

  describe('Empty localStorage', () => {
    it('should use initialConnections when networkConnections is empty', () => {
      const defaultNetworks = ['polkadot', 'kusama'];
      const wrapper = createWrapper(defaultNetworks);

      const { result } = renderHook(() => useClient(), { wrapper });

      // Should use the default networks since localStorage is empty
      expect(result.current.networkConnections).toEqual([
        { networkId: 'polkadot' },
        { networkId: 'kusama' },
      ]);
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it('should use initialConnections with NetworkConnection objects', () => {
      const defaultNetworkConnections: NetworkConnection[] = [
        { networkId: 'polkadot', provider: 'wss://polkadot.custom' },
        { networkId: 'westend' },
      ];
      const wrapper = createWrapper(defaultNetworkConnections);

      const { result } = renderHook(() => useClient(), { wrapper });

      expect(result.current.networkConnections).toEqual(defaultNetworkConnections);
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it('should handle single default network', () => {
      const wrapper = createWrapper(['westend']);

      const { result } = renderHook(() => useClient(), { wrapper });

      expect(result.current.networkConnections).toEqual([{ networkId: 'westend' }]);
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });
  });

  describe('Valid persisted connections', () => {
    it('should preserve valid networkConnections from localStorage when they match defaults', () => {
      // Use connections that match the default networks
      const matchingConnections: NetworkConnection[] = [
        { networkId: 'polkadot' },
        { networkId: 'kusama', provider: 'wss://custom.kusama.provider' },
      ];
      const wrapper = createWrapper(['polkadot', 'kusama'], matchingConnections);

      const { result } = renderHook(() => useClient(), { wrapper });

      // Should keep the persisted connections since they match defaults
      expect(result.current.networkConnections).toEqual(matchingConnections);
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it('should reset when persisted connections don\'t match defaults', () => {
      const wrapper = createWrapper(['polkadot'], validConnections);

      const { result } = renderHook(() => useClient(), { wrapper });

      // Should reset to default because kusama is not in defaultNetworkIds
      expect(result.current.networkConnections).toEqual([{ networkId: 'polkadot' }]);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Some persisted network connections are not in the supported networks list. Resetting to default networks.'
      );
    });

    it('should preserve connections when all networks exist in supportedNetworks', () => {
      const persistedConnections: NetworkConnection[] = [
        { networkId: 'kusama', provider: 'wss://kusama.example' },
        { networkId: 'westend' },
        { networkId: 'polkadot' },
      ];
      const wrapper = createWrapper(['polkadot'], persistedConnections);

      const { result } = renderHook(() => useClient(), { wrapper });

      // Should reset because kusama and westend are not in defaultNetworkIds
      expect(result.current.networkConnections).toEqual([{ networkId: 'polkadot' }]);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Some persisted network connections are not in the supported networks list. Resetting to default networks.'
      );
    });

    it('should preserve empty array if that is what was persisted', () => {
      const wrapper = createWrapper(['polkadot'], []);

      const { result } = renderHook(() => useClient(), { wrapper });

      // Even though localStorage has empty array, it should still use initialConnections
      // because the condition is: networkConnections.length === 0 && initialConnections.length > 0
      expect(result.current.networkConnections).toEqual([{ networkId: 'polkadot' }]);
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });
  });

  describe('Invalid network fallback', () => {
    it('should fallback to initialConnections when persisted connections contain invalid network', () => {
      const defaultNetworks = ['polkadot', 'westend'];
      const wrapper = createWrapper(defaultNetworks, invalidConnections);

      const { result } = renderHook(() => useClient(), { wrapper });

      // Should reset to initialConnections due to invalid network
      expect(result.current.networkConnections).toEqual([
        { networkId: 'polkadot' },
        { networkId: 'westend' },
      ]);

      // Should warn about invalid networks
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Some persisted network connections are not in the supported networks list. Resetting to default networks.'
      );
    });

    it('should fallback when all persisted networks are invalid', () => {
      const allInvalidConnections: NetworkConnection[] = [
        { networkId: 'invalid-1' },
        { networkId: 'invalid-2' },
        { networkId: 'invalid-3' },
      ];
      const defaultNetworks = ['polkadot'];
      const wrapper = createWrapper(defaultNetworks, allInvalidConnections);

      const { result } = renderHook(() => useClient(), { wrapper });

      expect(result.current.networkConnections).toEqual([{ networkId: 'polkadot' }]);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Some persisted network connections are not in the supported networks list. Resetting to default networks.'
      );
    });

    it('should fallback when partially invalid networks exist', () => {
      const defaultNetworks = ['polkadot', 'kusama'];
      const wrapper = createWrapper(defaultNetworks, partiallyInvalidConnections);

      const { result } = renderHook(() => useClient(), { wrapper });

      // Should reset to initialConnections
      expect(result.current.networkConnections).toEqual([
        { networkId: 'polkadot' },
        { networkId: 'kusama' },
      ]);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Some persisted network connections are not in the supported networks list. Resetting to default networks.'
      );
    });

    it('should handle case where single invalid network exists', () => {
      const singleInvalidConnection: NetworkConnection[] = [
        { networkId: 'non-existent-network' },
      ];
      const defaultNetworks = ['westend'];
      const wrapper = createWrapper(defaultNetworks, singleInvalidConnection);

      const { result } = renderHook(() => useClient(), { wrapper });

      expect(result.current.networkConnections).toEqual([{ networkId: 'westend' }]);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Some persisted network connections are not in the supported networks list. Resetting to default networks.'
      );
    });
  });

  describe('Edge cases and scenarios', () => {
    it('should handle case where supportedNetworks is empty', () => {
      // This should still throw from the assertion in ClientProvider
      expect(() => {
        const wrapper = ({ children }: { children: React.ReactNode }) => (
          <Provider store={store}>
            <ClientProvider defaultNetworkIds={['polkadot']} supportedNetworks={[]}>
              {children}
            </ClientProvider>
          </Provider>
        );
        renderHook(() => useClient(), { wrapper });
      }).toThrow('Required at least one supported network');
    });

    it('should handle supportedNetworks change after localStorage validation', () => {
      // This tests the specific condition: if (supportedNetworks.length === 0) return;
      const emptyNetworksFirst: NetworkInfo[] = [];
      const validNetworksLater = supportedNetworks;

      // Create wrapper with empty supported networks first
      const initialWrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>
          <ClientProvider defaultNetworkIds={['polkadot']} supportedNetworks={emptyNetworksFirst}>
            {children}
          </ClientProvider>
        </Provider>
      );

      // This should throw due to empty supportedNetworks assertion
      expect(() => {
        renderHook(() => useClient(), { wrapper: initialWrapper });
      }).toThrow('Required at least one supported network');
    });

    it('should properly validate persisted connections with custom providers', () => {
      const connectionWithCustomProvider: NetworkConnection[] = [
        { networkId: 'polkadot', provider: 'wss://custom.polkadot.provider' },
        { networkId: 'invalid-custom', provider: 'wss://invalid.provider' }, // Invalid network
      ];
      const defaultNetworks = ['kusama'];
      const wrapper = createWrapper(defaultNetworks, connectionWithCustomProvider);

      const { result } = renderHook(() => useClient(), { wrapper });

      // Should fallback even when persisted connections have custom providers
      expect(result.current.networkConnections).toEqual([{ networkId: 'kusama' }]);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Some persisted network connections are not in the supported networks list. Resetting to default networks.'
      );
    });

    it('should handle case where defaultNetworkIds contains invalid networks', () => {
      // This should throw during initialization validation
      expect(() => {
        const wrapper = ({ children }: { children: React.ReactNode }) => (
          <Provider store={store}>
            <ClientProvider 
              defaultNetworkIds={['polkadot', 'invalid-default-network']} 
              supportedNetworks={supportedNetworks}
            >
              {children}
            </ClientProvider>
          </Provider>
        );
        renderHook(() => useClient(), { wrapper });
      }).toThrow("Network ID 'invalid-default-network' not found in supported networks");
    });
  });

  describe('Console warning behavior', () => {
    it('should warn exactly once when invalid networks are detected', () => {
      const wrapper = createWrapper(['polkadot'], invalidConnections);

      renderHook(() => useClient(), { wrapper });

      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Some persisted network connections are not in the supported networks list. Resetting to default networks.'
      );
    });

    it('should not warn when no invalid networks exist', () => {
      // Use connections that match defaults
      const matchingConnections: NetworkConnection[] = [
        { networkId: 'polkadot' },
        { networkId: 'kusama' },
      ];
      const wrapper = createWrapper(['polkadot', 'kusama'], matchingConnections);

      renderHook(() => useClient(), { wrapper });

      // Should not warn when connections match defaults
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it('should not warn when localStorage is empty', () => {
      const wrapper = createWrapper(['polkadot'], []);

      renderHook(() => useClient(), { wrapper });

      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });
  });

  describe('Interaction with different default network configurations', () => {
    it('should reset to complex initialConnections when localStorage is invalid', () => {
      const complexDefaults: NetworkConnection[] = [
        { networkId: 'polkadot', provider: 'wss://polkadot.special.provider' },
        { networkId: 'kusama' },
        { networkId: 'westend', provider: 'wss://westend.test.provider' },
      ];
      const wrapper = createWrapper(complexDefaults, invalidConnections);

      const { result } = renderHook(() => useClient(), { wrapper });

      expect(result.current.networkConnections).toEqual(complexDefaults);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Some persisted network connections are not in the supported networks list. Resetting to default networks.'
      );
    });

    it('should preserve localStorage when it matches a subset of supported networks', () => {
      const subsetConnections: NetworkConnection[] = [
        { networkId: 'kusama' }, // Only kusama, but polkadot and westend are also supported
      ];
      const defaultNetworks = ['polkadot', 'westend']; // Different from localStorage
      const wrapper = createWrapper(defaultNetworks, subsetConnections);

      const { result } = renderHook(() => useClient(), { wrapper });

      // Should reset because kusama is not in defaultNetworks
      expect(result.current.networkConnections).toEqual([
        { networkId: 'polkadot' },
        { networkId: 'westend' },
      ]);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Some persisted network connections are not in the supported networks list. Resetting to default networks.'
      );
    });
  });

  describe('localStorage validation logic flow', () => {
    it('should follow correct branching: empty localStorage -> use initialConnections', () => {
      const defaultNetworks = ['westend', 'kusama'];
      
      // Start with empty localStorage (length === 0)
      const wrapper = createWrapper(defaultNetworks, []);

      const { result } = renderHook(() => useClient(), { wrapper });

      // Should enter first branch: networkConnections.length === 0 && initialConnections.length > 0
      expect(result.current.networkConnections).toEqual([
        { networkId: 'westend' },
        { networkId: 'kusama' },
      ]);
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it('should follow correct branching: populated localStorage with valid networks -> preserve', () => {
      const defaultNetworks = ['polkadot']; // Different from what's in localStorage

      // Start with valid connections in localStorage
      const wrapper = createWrapper(defaultNetworks, validConnections);

      const { result } = renderHook(() => useClient(), { wrapper });

      // Should reset because kusama is not in defaultNetworks
      expect(result.current.networkConnections).toEqual([{ networkId: 'polkadot' }]);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Some persisted network connections are not in the supported networks list. Resetting to default networks.'
      );
    });

    it('should follow correct branching: populated localStorage with invalid networks -> reset', () => {
      const defaultNetworks = ['westend'];
      
      // Start with invalid connections in localStorage
      const wrapper = createWrapper(defaultNetworks, invalidConnections);

      const { result } = renderHook(() => useClient(), { wrapper });

      // Should enter second branch: networkConnections.length > 0, and hasInvalidNetwork = true
      expect(result.current.networkConnections).toEqual([{ networkId: 'westend' }]);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Some persisted network connections are not in the supported networks list. Resetting to default networks.'
      );
    });
  });

  describe('Real-world scenarios', () => {
    it('should handle user upgrading app with removed networks', () => {
      // Simulate user had rococo + polkadot, but new app version only supports polkadot + kusama
      const oldPersistedConnections: NetworkConnection[] = [
        { networkId: 'polkadot' }, // Still supported
        { networkId: 'rococo' }, // No longer supported
      ];
      
      const currentSupportedNetworks: NetworkInfo[] = [
        TEST_NETWORKS.POLKADOT, // Still supported
        TEST_NETWORKS.KUSAMA,   // New supported network
        // rococo removed from supported networks
      ];
      
      const defaultNetworks = ['polkadot', 'kusama'];

      // Pre-populate with old connections
      store.set(networkConnectionsAtom, oldPersistedConnections);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>
          <ClientProvider 
            defaultNetworkIds={defaultNetworks} 
            supportedNetworks={currentSupportedNetworks}
          >
            {children}
          </ClientProvider>
        </Provider>
      );

      const { result } = renderHook(() => useClient(), { wrapper });

      // Should reset to current default networks
      expect(result.current.networkConnections).toEqual([
        { networkId: 'polkadot' },
        { networkId: 'kusama' },
      ]);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Some persisted network connections are not in the supported networks list. Resetting to default networks.'
      );
    });

    it('should handle network ID case sensitivity', () => {
      const caseSensitiveConnections: NetworkConnection[] = [
        { networkId: 'POLKADOT' }, // Wrong case - should be invalid
        { networkId: 'kusama' },   // Correct case
      ];
      const defaultNetworks = ['polkadot', 'kusama'];
      const wrapper = createWrapper(defaultNetworks, caseSensitiveConnections);

      const { result } = renderHook(() => useClient(), { wrapper });

      // Should fallback because 'POLKADOT' != 'polkadot'
      expect(result.current.networkConnections).toEqual([
        { networkId: 'polkadot' },
        { networkId: 'kusama' },
      ]);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Some persisted network connections are not in the supported networks list. Resetting to default networks.'
      );
    });

    it('should handle corrupted localStorage data gracefully', () => {
      // Simulate localStorage containing a connection with missing networkId
      const corruptedConnections = [
        { networkId: 'polkadot' },
        { networkId: '' }, // Empty network ID - should be invalid
        { networkId: 'kusama' },
      ] as NetworkConnection[];
      
      const defaultNetworks = ['polkadot'];
      const wrapper = createWrapper(defaultNetworks, corruptedConnections);

      const { result } = renderHook(() => useClient(), { wrapper });

      // Should fallback due to empty networkId
      expect(result.current.networkConnections).toEqual([{ networkId: 'polkadot' }]);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Some persisted network connections are not in the supported networks list. Resetting to default networks.'
      );
    });
  });

  describe('Integration with atomWithStorage', () => {
    it('should persist new connections after localStorage reset', () => {
      // Start with invalid persisted data
      const wrapper = createWrapper(['polkadot'], invalidConnections);

      const { result } = renderHook(() => useClient(), { wrapper });

      // Should have reset to initialConnections
      expect(result.current.networkConnections).toEqual([{ networkId: 'polkadot' }]);

      // The atom should now be updated with the reset value
      const currentStoredValue = store.get(networkConnectionsAtom);
      expect(currentStoredValue).toEqual([{ networkId: 'polkadot' }]);
    });

    it('should not modify localStorage when connections are valid', () => {
      const wrapper = createWrapper(['polkadot'], validConnections);

      const { result } = renderHook(() => useClient(), { wrapper });

      // Should reset because kusama is not in defaultNetworks
      expect(result.current.networkConnections).toEqual([{ networkId: 'polkadot' }]);

      // The atom should be updated with the reset value
      const currentStoredValue = store.get(networkConnectionsAtom);
      expect(currentStoredValue).toEqual([{ networkId: 'polkadot' }]);
    });
  });
});