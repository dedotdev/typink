import { describe, it, expect, beforeEach } from 'vitest';
import { createStore } from 'jotai';
import {
  clientsMapAtom,
  clientAtom,
  clientReadyStatesAtom,
  clientReadyAtom,
  networkIdAtom,
  networkConnectionsAtom,
  networksAtom,
  setNetworksAtom,
  initializeNetworkIdsAtom,
  supportedNetworksAtom,
  defaultNetworkIdAtom,
} from '../clientAtoms.js';
import { NetworkInfo } from '../../types.js';

describe('Multi-client Atoms', () => {
  let store: ReturnType<typeof createStore>;

  const mockNetworks: NetworkInfo[] = [
    {
      id: 'polkadot',
      name: 'Polkadot',
      providers: ['wss://polkadot.api'],
      decimals: 10,
      logo: '',
      symbol: 'DOT',
    },
    {
      id: 'kusama',
      name: 'Kusama',
      providers: ['wss://kusama.api'],
      decimals: 12,
      logo: '',
      symbol: 'KSM',
    },
    {
      id: 'westend',
      name: 'Westend',
      providers: ['wss://westend.api'],
      decimals: 12,
      logo: '',
      symbol: 'WND',
    },
  ];

  const mockClient = (networkId: string) => ({
    disconnect: async () => {},
    setSigner: () => {},
    _networkId: networkId,
  } as any);

  beforeEach(() => {
    store = createStore();
    // Initialize supported networks
    store.set(supportedNetworksAtom, mockNetworks);
    store.set(defaultNetworkIdAtom, 'polkadot');
  });

  describe('clientsMapAtom', () => {
    it('should store multiple clients', () => {
      const clientsMap = new Map();
      clientsMap.set('polkadot', mockClient('polkadot'));
      clientsMap.set('kusama', mockClient('kusama'));

      store.set(clientsMapAtom, clientsMap);

      const result = store.get(clientsMapAtom);
      expect(result.size).toBe(2);
      expect(result.get('polkadot')?._networkId).toBe('polkadot');
      expect(result.get('kusama')?._networkId).toBe('kusama');
    });

    it('should start with empty map', () => {
      const result = store.get(clientsMapAtom);
      expect(result.size).toBe(0);
    });
  });

  describe('clientAtom (backward compatibility)', () => {
    it('should return primary client from clientsMapAtom', () => {
      const clientsMap = new Map();
      clientsMap.set('polkadot', mockClient('polkadot'));
      clientsMap.set('kusama', mockClient('kusama'));

      store.set(clientsMapAtom, clientsMap);

      const primaryClient = store.get(clientAtom);
      expect(primaryClient?._networkId).toBe('polkadot');
    });

    it('should return undefined when no client for primary network', () => {
      const clientsMap = new Map();
      clientsMap.set('kusama', mockClient('kusama'));

      store.set(clientsMapAtom, clientsMap);

      const primaryClient = store.get(clientAtom);
      expect(primaryClient).toBeUndefined();
    });

    it('should update when primary network changes', () => {
      const clientsMap = new Map();
      clientsMap.set('polkadot', mockClient('polkadot'));
      clientsMap.set('kusama', mockClient('kusama'));

      store.set(clientsMapAtom, clientsMap);
      
      // Change primary network
      store.set(defaultNetworkIdAtom, 'kusama');

      const primaryClient = store.get(clientAtom);
      expect(primaryClient?._networkId).toBe('kusama');
    });
  });

  describe('clientReadyStatesAtom', () => {
    it('should track ready states for multiple clients', () => {
      const readyStates = new Map();
      readyStates.set('polkadot', true);
      readyStates.set('kusama', false);
      readyStates.set('westend', true);

      store.set(clientReadyStatesAtom, readyStates);

      const result = store.get(clientReadyStatesAtom);
      expect(result.get('polkadot')).toBe(true);
      expect(result.get('kusama')).toBe(false);
      expect(result.get('westend')).toBe(true);
    });
  });

  describe('clientReadyAtom (unified ready state)', () => {
    it('should return true when ALL connected networks are ready', () => {
      // Set up network connections
      store.set(networkConnectionsAtom, [
        { networkId: 'polkadot' },
        { networkId: 'kusama' }
      ]);

      const readyStates = new Map();
      readyStates.set('polkadot', true);
      readyStates.set('kusama', true); // All networks ready

      store.set(clientReadyStatesAtom, readyStates);

      const overallReady = store.get(clientReadyAtom);
      expect(overallReady).toBe(true);
    });

    it('should return false when any connected network is not ready', () => {
      // Set up network connections
      store.set(networkConnectionsAtom, [
        { networkId: 'polkadot' },
        { networkId: 'kusama' }
      ]);

      const readyStates = new Map();
      readyStates.set('polkadot', true);
      readyStates.set('kusama', false); // One network not ready

      store.set(clientReadyStatesAtom, readyStates);

      const overallReady = store.get(clientReadyAtom);
      expect(overallReady).toBe(false);
    });

    it('should return false when no networks are connected', () => {
      store.set(networkConnectionsAtom, []);
      
      const readyStates = new Map();
      readyStates.set('polkadot', true);
      
      store.set(clientReadyStatesAtom, readyStates);

      const overallReady = store.get(clientReadyAtom);
      expect(overallReady).toBe(false);
    });
  });

  describe('networkConnectionsAtom', () => {
    it('should store network connections', () => {
      const connections = [
        { networkId: 'polkadot' },
        { networkId: 'kusama' },
        { networkId: 'westend' }
      ];
      store.set(networkConnectionsAtom, connections);

      const result = store.get(networkConnectionsAtom);
      expect(result).toEqual(connections);
    });

    it('should start with empty array', () => {
      const result = store.get(networkConnectionsAtom);
      expect(result).toEqual([]);
    });
  });

  describe('networksAtom', () => {
    it('should derive NetworkInfo from connections', () => {
      const connections = [
        { networkId: 'polkadot' },
        { networkId: 'kusama' }
      ];
      store.set(networkConnectionsAtom, connections);

      const networks = store.get(networksAtom);
      expect(networks).toHaveLength(2);
      expect(networks[0].id).toBe('polkadot');
      expect(networks[1].id).toBe('kusama');
    });

    it('should handle unknown network IDs gracefully', () => {
      const connections = [
        { networkId: 'polkadot' },
        { networkId: 'unknown-network' }
      ];
      store.set(networkConnectionsAtom, connections);

      const networks = store.get(networksAtom);
      expect(networks).toHaveLength(1); // Only polkadot should be included
      expect(networks[0].id).toBe('polkadot');
    });
  });

  describe('setNetworksAtom (Unified API)', () => {
    it('should set networks with NetworkId array', () => {
      store.set(setNetworksAtom, ['polkadot', 'kusama', 'westend']);

      // Verify connections were created
      const connections = store.get(networkConnectionsAtom);
      expect(connections).toEqual([
        { networkId: 'polkadot' },
        { networkId: 'kusama' },
        { networkId: 'westend' }
      ]);

      // Verify networks atom
      const networks = store.get(networksAtom);
      expect(networks).toHaveLength(3);
      expect(networks[0].id).toBe('polkadot');
      expect(networks[1].id).toBe('kusama');
      expect(networks[2].id).toBe('westend');
    });

    it('should set networks with NetworkConnection array', () => {
      const networkConnections = [
        { networkId: 'polkadot' },
        { networkId: 'kusama', provider: 'wss://kusama-custom.api' },
        { networkId: 'westend', provider: 'light-client' },
      ];

      store.set(setNetworksAtom, networkConnections);

      // Verify custom connections were set
      const connections = store.get(networkConnectionsAtom);
      expect(connections).toEqual([
        { networkId: 'polkadot' },
        { networkId: 'kusama', provider: 'wss://kusama-custom.api' },
        { networkId: 'westend', provider: 'light-client' }
      ]);
    });

    it('should replace existing networks', () => {
      // Set initial networks
      store.set(setNetworksAtom, ['polkadot', 'kusama', 'westend']);
      expect(store.get(networkConnectionsAtom)).toHaveLength(3);

      // Replace with new networks
      store.set(setNetworksAtom, ['polkadot']);
      
      const connections = store.get(networkConnectionsAtom);
      expect(connections).toEqual([
        { networkId: 'polkadot' }
      ]);
    });

    it('should handle empty array', () => {
      // Set some networks first
      store.set(setNetworksAtom, ['polkadot', 'kusama']);
      
      // Clear them
      store.set(setNetworksAtom, []);
      
      expect(store.get(networkConnectionsAtom)).toEqual([]);
      // networksAtom falls back to first supported network when no connections
      const networks = store.get(networksAtom);
      expect(networks).toHaveLength(1);
      expect(networks[0].id).toBe('polkadot');
    });

    it('should handle mixed NetworkId and NetworkConnection input', () => {
      const mixedInput = [
        'polkadot', // NetworkId
        { networkId: 'kusama', provider: 'light-client' }, // NetworkConnection
      ];

      store.set(setNetworksAtom, mixedInput);

      const connections = store.get(networkConnectionsAtom);
      expect(connections).toEqual([
        { networkId: 'polkadot' },
        { networkId: 'kusama', provider: 'light-client' }
      ]);
    });
  });

  describe('Multi-client setup integration', () => {
    it('should support multiple networks with unified API', () => {
      // Set up networks using new unified API
      store.set(setNetworksAtom, ['polkadot', 'kusama', 'westend']);

      // Set up clients
      const clientsMap = new Map();
      clientsMap.set('polkadot', mockClient('polkadot'));
      clientsMap.set('kusama', mockClient('kusama'));
      clientsMap.set('westend', mockClient('westend'));
      store.set(clientsMapAtom, clientsMap);

      // Set up ready states
      const readyStates = new Map();
      readyStates.set('polkadot', true);
      readyStates.set('kusama', true);
      readyStates.set('westend', false);
      store.set(clientReadyStatesAtom, readyStates);

      // Verify primary network (first in the list)
      expect(store.get(networkIdAtom)).toBe('polkadot');
      expect(store.get(clientAtom)?._networkId).toBe('polkadot');
      // With new logic, ready is false because not ALL networks are ready (westend is false)
      expect(store.get(clientReadyAtom)).toBe(false);

      // Verify all networks
      const networks = store.get(networksAtom);
      expect(networks).toHaveLength(3);
      expect(networks[0].id).toBe('polkadot'); // Primary
      expect(networks[1].id).toBe('kusama');   // Secondary
      expect(networks[2].id).toBe('westend');  // Secondary

      // Verify all clients are accessible
      const allClients = store.get(clientsMapAtom);
      expect(allClients.size).toBe(3);
      expect(allClients.get('kusama')?._networkId).toBe('kusama');
      expect(allClients.get('westend')?._networkId).toBe('westend');

      // Verify ready states
      const allReadyStates = store.get(clientReadyStatesAtom);
      expect(allReadyStates.get('kusama')).toBe(true);
      expect(allReadyStates.get('westend')).toBe(false);
      
      // Test that when all networks become ready, overall ready is true
      const updatedReadyStates = new Map();
      updatedReadyStates.set('polkadot', true);
      updatedReadyStates.set('kusama', true);
      updatedReadyStates.set('westend', true);
      store.set(clientReadyStatesAtom, updatedReadyStates);
      expect(store.get(clientReadyAtom)).toBe(true);
    });
  });
});