import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createStore } from 'jotai';
import { initializeClientsAtom, updateClientConnectionStatusAtom } from '../clientActions.js';
import {
  clientConnectionStatusMapAtom,
  networkConnectionsAtom,
  supportedNetworksAtom,
  setNetworkAtom,
  setNetworksAtom,
} from '../clientAtoms.js';
import { NetworkConnection, NetworkInfo, JsonRpcApi, ClientConnectionStatus } from '../../types.js';
import { DedotClient } from 'dedot';

// Mock dedot dependencies
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

describe('Client Connection Status', () => {
  let store: ReturnType<typeof createStore>;

  const mockNetworks: NetworkInfo[] = [
    {
      id: 'polkadot',
      name: 'Polkadot',
      providers: ['wss://polkadot.api.test'],
      decimals: 10,
      logo: '',
      symbol: 'DOT',
    },
    {
      id: 'kusama',
      name: 'Kusama',
      providers: ['wss://kusama.api.test'],
      decimals: 12,
      logo: '',
      symbol: 'KSM',
    },
    {
      id: 'westend',
      name: 'Westend',
      providers: ['wss://westend.api.test'],
      decimals: 12,
      logo: '',
      symbol: 'WND',
      jsonRpcApi: JsonRpcApi.LEGACY,
    },
  ];

  // Helper to create a mock provider with event simulation capabilities
  const createMockProvider = () => {
    const eventHandlers = new Map<string, Function[]>();

    const provider = {
      status: 'connecting',
      on: vi.fn((event: string, handler: Function) => {
        if (!eventHandlers.has(event)) {
          eventHandlers.set(event, []);
        }
        eventHandlers.get(event)!.push(handler);
      }),
      // Helper method to simulate events (not part of real provider)
      _simulateEvent: (event: string, ...args: any[]) => {
        const handlers = eventHandlers.get(event) || [];
        handlers.forEach((handler) => handler(...args));
      },
      _getEventHandlers: () => eventHandlers,
    };

    return provider;
  };

  const createMockClient = (
    networkId: string,
    providerStatus: 'connected' | 'connecting' | 'disconnected' = 'connected',
  ): any => {
    const provider = createMockProvider();
    provider.status = providerStatus;

    return {
      disconnect: vi.fn().mockResolvedValue(undefined),
      setSigner: vi.fn(),
      provider,
      _networkId: networkId, // For testing identification
    } as unknown as any;
  };

  beforeEach(async () => {
    store = createStore();
    vi.clearAllMocks();

    // Mock Worker for light client tests
    (global as any).Worker = vi.fn().mockImplementation(() => ({
      postMessage: vi.fn(),
      terminate: vi.fn(),
    }));

    // Mock URL constructor
    (global as any).URL = vi.fn().mockImplementation((url) => ({ href: url }));

    // Reset modules
    const dedotModule = await import('dedot');
    const smoldotModule = await import('dedot/smoldot/with-worker');
    const { DedotClient, LegacyClient, WsProvider, SmoldotProvider } = vi.mocked(dedotModule);
    const { startWithWorker } = vi.mocked(smoldotModule);

    vi.mocked(DedotClient.new).mockClear();
    vi.mocked(LegacyClient.new).mockClear();
    vi.mocked(WsProvider).mockClear();
    vi.mocked(SmoldotProvider).mockClear();
    startWithWorker.mockClear();

    // Set up basic store state
    store.set(supportedNetworksAtom, mockNetworks);
  });

  describe('updateClientConnectionStatusAtom', () => {
    it('should update connection status for active networks', () => {
      // Set up active network connections
      const connections: NetworkConnection[] = [{ networkId: 'polkadot' }, { networkId: 'kusama' }];
      store.set(networkConnectionsAtom, connections);

      // Update status for active network
      store.set(updateClientConnectionStatusAtom, 'polkadot', ClientConnectionStatus.Connected);

      const statusMap = store.get(clientConnectionStatusMapAtom);
      expect(statusMap.get('polkadot')).toBe(ClientConnectionStatus.Connected);
    });

    it('should ignore status updates for inactive networks (race condition prevention)', () => {
      // Set up active network connections (only polkadot)
      const connections: NetworkConnection[] = [{ networkId: 'polkadot' }];
      store.set(networkConnectionsAtom, connections);

      // Try to update status for inactive network (kusama)
      store.set(updateClientConnectionStatusAtom, 'kusama', ClientConnectionStatus.Connected);

      const statusMap = store.get(clientConnectionStatusMapAtom);
      expect(statusMap.has('kusama')).toBe(false);
    });

    it('should update status for multiple networks independently', () => {
      // Set up multiple active network connections
      const connections: NetworkConnection[] = [
        { networkId: 'polkadot' },
        { networkId: 'kusama' },
        { networkId: 'westend' },
      ];
      store.set(networkConnectionsAtom, connections);

      // Update different statuses
      store.set(updateClientConnectionStatusAtom, 'polkadot', ClientConnectionStatus.Connected);
      store.set(updateClientConnectionStatusAtom, 'kusama', ClientConnectionStatus.Connecting);
      store.set(updateClientConnectionStatusAtom, 'westend', ClientConnectionStatus.Error);

      const statusMap = store.get(clientConnectionStatusMapAtom);
      expect(statusMap.get('polkadot')).toBe(ClientConnectionStatus.Connected);
      expect(statusMap.get('kusama')).toBe(ClientConnectionStatus.Connecting);
      expect(statusMap.get('westend')).toBe(ClientConnectionStatus.Error);
    });
  });

  describe('Provider Event Handling', () => {
    beforeEach(() => {
      // Set up for provider event tests
      const connections: NetworkConnection[] = [{ networkId: 'polkadot' }];
      store.set(networkConnectionsAtom, connections);
    });

    it('should handle provider "connected" event', async () => {
      // Mock client creation
      const mockClient = createMockClient('polkadot', 'connected');

      const { DedotClient } = vi.mocked(await import('dedot'));
      vi.mocked(DedotClient.new).mockResolvedValue(mockClient);

      // Initialize clients (this will set up event listeners)
      await store.set(initializeClientsAtom);

      // Verify initial status based on provider.status
      let statusMap = store.get(clientConnectionStatusMapAtom);
      expect(statusMap.get('polkadot')).toBe(ClientConnectionStatus.Connected);

      // Reset to test event handling
      store.set(updateClientConnectionStatusAtom, 'polkadot', ClientConnectionStatus.Connecting);

      // Simulate 'connected' event
      (mockClient.provider as any)._simulateEvent('connected');

      // Verify status update
      statusMap = store.get(clientConnectionStatusMapAtom);
      expect(statusMap.get('polkadot')).toBe(ClientConnectionStatus.Connected);
    });

    it('should handle provider "disconnected" event', async () => {
      // Mock client creation
      const mockClient = createMockClient('polkadot', 'connecting');

      const { DedotClient } = vi.mocked(await import('dedot'));
      vi.mocked(DedotClient.new).mockResolvedValue(mockClient);

      // Initialize clients
      await store.set(initializeClientsAtom);

      // Simulate 'disconnected' event
      (mockClient.provider as any)._simulateEvent('disconnected');

      // Verify status update
      const statusMap = store.get(clientConnectionStatusMapAtom);
      expect(statusMap.get('polkadot')).toBe(ClientConnectionStatus.NotConnected);
    });

    it('should handle provider "reconnecting" event', async () => {
      // Mock client creation
      const mockClient = createMockClient('polkadot', 'connected');

      const { DedotClient } = vi.mocked(await import('dedot'));
      vi.mocked(DedotClient.new).mockResolvedValue(mockClient);

      // Initialize clients
      await store.set(initializeClientsAtom);

      // Simulate 'reconnecting' event
      (mockClient.provider as any)._simulateEvent('reconnecting');

      // Verify status update
      const statusMap = store.get(clientConnectionStatusMapAtom);
      expect(statusMap.get('polkadot')).toBe(ClientConnectionStatus.Connecting);
    });

    it('should handle provider "error" event - set Error when not Connected', async () => {
      // Mock client creation
      const mockClient = createMockClient('polkadot', 'connecting');

      const { DedotClient } = vi.mocked(await import('dedot'));
      vi.mocked(DedotClient.new).mockResolvedValue(mockClient);

      // Initialize clients
      await store.set(initializeClientsAtom);

      // Simulate 'error' event while not connected
      const error = new Error('Connection failed');
      (mockClient.provider as any)._simulateEvent('error', error);

      // Verify status update to Error
      const statusMap = store.get(clientConnectionStatusMapAtom);
      expect(statusMap.get('polkadot')).toBe(ClientConnectionStatus.Error);
    });

    it('should handle provider "error" event - ignore when Connected', async () => {
      // Mock client creation
      const mockClient = createMockClient('polkadot', 'connected');

      const { DedotClient } = vi.mocked(await import('dedot'));
      vi.mocked(DedotClient.new).mockResolvedValue(mockClient);

      // Initialize clients
      await store.set(initializeClientsAtom);

      // Verify we start as Connected
      let statusMap = store.get(clientConnectionStatusMapAtom);
      expect(statusMap.get('polkadot')).toBe(ClientConnectionStatus.Connected);

      // Simulate 'error' event while connected
      const error = new Error('Minor error');
      (mockClient.provider as any)._simulateEvent('error', error);

      // Verify status remains Connected (error ignored)
      statusMap = store.get(clientConnectionStatusMapAtom);
      expect(statusMap.get('polkadot')).toBe(ClientConnectionStatus.Connected);
    });

    it('should attach all required event listeners', async () => {
      // Mock client creation
      const mockClient = createMockClient('polkadot', 'connecting');

      const { DedotClient } = vi.mocked(await import('dedot'));
      vi.mocked(DedotClient.new).mockResolvedValue(mockClient);

      // Initialize clients
      await store.set(initializeClientsAtom);

      // Verify all event listeners were attached
      expect(mockClient.provider.on).toHaveBeenCalledWith('connected', expect.any(Function));
      expect(mockClient.provider.on).toHaveBeenCalledWith('disconnected', expect.any(Function));
      expect(mockClient.provider.on).toHaveBeenCalledWith('reconnecting', expect.any(Function));
      expect(mockClient.provider.on).toHaveBeenCalledWith('error', expect.any(Function));
    });
  });

  describe('Connection Status Integration', () => {
    it('should set Connecting status during client initialization', async () => {
      // Set up network connections
      const connections: NetworkConnection[] = [{ networkId: 'polkadot' }];
      store.set(networkConnectionsAtom, connections);

      // Mock client creation (simulate delay)
      const mockClient = createMockClient('polkadot');

      const { DedotClient } = vi.mocked(await import('dedot'));
      vi.mocked(DedotClient.new).mockImplementation(async () => {
        // Check status is set to Connecting during initialization
        const statusMap = store.get(clientConnectionStatusMapAtom);
        expect(statusMap.get('polkadot')).toBe(ClientConnectionStatus.Connecting);

        return mockClient;
      });

      // Initialize clients
      await store.set(initializeClientsAtom);
    });

    it('should set Error status when client creation fails', async () => {
      // Set up network connections
      const connections: NetworkConnection[] = [{ networkId: 'polkadot' }];
      store.set(networkConnectionsAtom, connections);

      // Mock client creation failure
      const { DedotClient } = vi.mocked(await import('dedot'));
      vi.mocked(DedotClient.new).mockRejectedValue(new Error('Failed to create client'));

      // Initialize clients (should handle error)
      try {
        await store.set(initializeClientsAtom);
      } catch (e) {
        // Expected to throw
      }

      // Verify Error status was set
      const statusMap = store.get(clientConnectionStatusMapAtom);
      expect(statusMap.get('polkadot')).toBe(ClientConnectionStatus.Error);
    });

    it('should clean up connection status when networks are removed via setNetworkAtom', () => {
      // Set up multiple networks
      const connections: NetworkConnection[] = [{ networkId: 'polkadot' }, { networkId: 'kusama' }];
      store.set(networkConnectionsAtom, connections);

      // Set some statuses
      store.set(updateClientConnectionStatusAtom, 'polkadot', ClientConnectionStatus.Connected);
      store.set(updateClientConnectionStatusAtom, 'kusama', ClientConnectionStatus.Connected);

      let statusMap = store.get(clientConnectionStatusMapAtom);
      expect(statusMap.has('polkadot')).toBe(true);
      expect(statusMap.has('kusama')).toBe(true);

      // Change primary network via setNetworkAtom (this should keep kusama as secondary)
      store.set(setNetworkAtom, { networkId: 'westend' });

      // Check that kusama is preserved (as secondary) but new network initialized
      statusMap = store.get(clientConnectionStatusMapAtom);
      expect(statusMap.has('westend')).toBe(true); // New primary
      expect(statusMap.has('kusama')).toBe(true); // Kept as secondary
      expect(statusMap.get('westend')).toBe(ClientConnectionStatus.NotConnected);
    });

    it('should clean up connection status when networks are replaced via setNetworksAtom', () => {
      // Set up initial networks
      const connections: NetworkConnection[] = [{ networkId: 'polkadot' }, { networkId: 'kusama' }];
      store.set(networkConnectionsAtom, connections);

      // Set some statuses
      store.set(updateClientConnectionStatusAtom, 'polkadot', ClientConnectionStatus.Connected);
      store.set(updateClientConnectionStatusAtom, 'kusama', ClientConnectionStatus.Error);

      let statusMap = store.get(clientConnectionStatusMapAtom);
      expect(statusMap.has('polkadot')).toBe(true);
      expect(statusMap.has('kusama')).toBe(true);

      // Replace networks entirely
      store.set(setNetworksAtom, [{ networkId: 'westend' }]);

      // Check that old networks are removed and new one initialized
      statusMap = store.get(clientConnectionStatusMapAtom);
      expect(statusMap.has('polkadot')).toBe(false); // Removed
      expect(statusMap.has('kusama')).toBe(false); // Removed
      expect(statusMap.has('westend')).toBe(true); // Added
      expect(statusMap.get('westend')).toBe(ClientConnectionStatus.NotConnected);
    });

    it('should preserve status for networks that remain after setNetworksAtom', () => {
      // Set up initial networks
      const connections: NetworkConnection[] = [{ networkId: 'polkadot' }, { networkId: 'kusama' }];
      store.set(networkConnectionsAtom, connections);

      // Set some statuses
      store.set(updateClientConnectionStatusAtom, 'polkadot', ClientConnectionStatus.Connected);
      store.set(updateClientConnectionStatusAtom, 'kusama', ClientConnectionStatus.Error);

      // Update networks but keep polkadot
      store.set(setNetworksAtom, [
        { networkId: 'polkadot' }, // Keep this one
        { networkId: 'westend' }, // Add new one
      ]);

      // Check that polkadot status is preserved
      const statusMap = store.get(clientConnectionStatusMapAtom);
      expect(statusMap.get('polkadot')).toBe(ClientConnectionStatus.Connected); // Preserved
      expect(statusMap.has('kusama')).toBe(false); // Removed
      expect(statusMap.get('westend')).toBe(ClientConnectionStatus.NotConnected); // New
    });
  });

  describe('Multiple Provider Event Scenarios', () => {
    it('should handle rapid status changes correctly', async () => {
      // Set up network
      const connections: NetworkConnection[] = [{ networkId: 'polkadot' }];
      store.set(networkConnectionsAtom, connections);

      // Mock client creation
      const mockClient = createMockClient('polkadot', 'connecting');

      const { DedotClient } = vi.mocked(await import('dedot'));
      vi.mocked(DedotClient.new).mockResolvedValue(mockClient);

      // Initialize clients
      await store.set(initializeClientsAtom);

      // Simulate rapid status changes
      (mockClient.provider as any)._simulateEvent('connected');
      let statusMap = store.get(clientConnectionStatusMapAtom);
      expect(statusMap.get('polkadot')).toBe(ClientConnectionStatus.Connected);

      (mockClient.provider as any)._simulateEvent('disconnected');
      statusMap = store.get(clientConnectionStatusMapAtom);
      expect(statusMap.get('polkadot')).toBe(ClientConnectionStatus.NotConnected);

      (mockClient.provider as any)._simulateEvent('reconnecting');
      statusMap = store.get(clientConnectionStatusMapAtom);
      expect(statusMap.get('polkadot')).toBe(ClientConnectionStatus.Connecting);

      (mockClient.provider as any)._simulateEvent('connected');
      statusMap = store.get(clientConnectionStatusMapAtom);
      expect(statusMap.get('polkadot')).toBe(ClientConnectionStatus.Connected);
    });

    it('should handle events for multiple networks simultaneously', async () => {
      // Set up multiple networks
      const connections: NetworkConnection[] = [{ networkId: 'polkadot' }, { networkId: 'kusama' }];
      store.set(networkConnectionsAtom, connections);

      // Mock client creation for both networks
      const mockClientPolkadot = createMockClient('polkadot', 'connecting');
      const mockClientKusama = createMockClient('kusama', 'connecting');

      const { DedotClient } = vi.mocked(await import('dedot'));
      vi.mocked(DedotClient.new).mockResolvedValueOnce(mockClientPolkadot).mockResolvedValueOnce(mockClientKusama);

      // Initialize clients
      await store.set(initializeClientsAtom);

      // Simulate different events for each network
      (mockClientPolkadot.provider as any)._simulateEvent('connected');
      (mockClientKusama.provider as any)._simulateEvent('error', new Error('Kusama failed'));

      // Verify both networks have correct status
      const statusMap = store.get(clientConnectionStatusMapAtom);
      expect(statusMap.get('polkadot')).toBe(ClientConnectionStatus.Connected);
      expect(statusMap.get('kusama')).toBe(ClientConnectionStatus.Error);
    });
  });
});
