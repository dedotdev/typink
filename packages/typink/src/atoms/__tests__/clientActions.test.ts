import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createStore } from 'jotai';
import {
  cleanupAllClientsAtom,
  initializeCacheMetadataAtom,
  initializeClientsAtom,
  initializeSupportedNetworksAtom,
  removeNetworkStateAtom,
  setNetworkClientAtom,
  updateClientSignerAtom,
} from '../clientActions.js';
import {
  cacheMetadataAtom,
  clientReadyAtom,
  clientsMapAtom,
  networkConnectionsAtom,
  supportedNetworksAtom,
} from '../clientAtoms.js';
import { externalSignerAtom } from '../walletAtoms.js';
import { JsonRpcApi, NetworkConnection, NetworkInfo } from '../../types.js';
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

describe('Client Actions', () => {
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
    {
      id: 'light-chain',
      name: 'Light Chain',
      providers: ['wss://light.api.test'],
      decimals: 12,
      logo: '',
      symbol: 'LIGHT',
      chainSpec: vi.fn().mockResolvedValue('mock-chain-spec'),
    },
    {
      id: 'para-chain',
      name: 'Para Chain',
      providers: ['wss://para.api.test'],
      decimals: 12,
      logo: '',
      symbol: 'PARA',
      chainSpec: vi.fn().mockResolvedValue('mock-para-chain-spec'),
      relayChain: {
        id: 'relay-chain',
        name: 'Relay Chain',
        providers: ['wss://relay.api.test'],
        decimals: 12,
        logo: '',
        symbol: 'RELAY',
        chainSpec: vi.fn().mockResolvedValue('mock-relay-chain-spec'),
      },
    },
  ];

  const mockClient = (networkId: string, shouldFailDisconnect = false): DedotClient =>
    ({
      disconnect: vi.fn().mockImplementation(async () => {
        if (shouldFailDisconnect) {
          throw new Error(`Disconnect failed for ${networkId}`);
        }
      }),
      setSigner: vi.fn(),
      provider: {
        on: vi.fn(),
        status: 'connected', // Mock status
      },
      _networkId: networkId, // For testing identification
    }) as unknown as DedotClient;

  const mockSigner = () => ({
    signRaw: vi.fn().mockResolvedValue({ id: 1, signature: '0xmock' }),
    signPayload: vi.fn().mockResolvedValue({ id: 1, signature: '0xmock' }),
  });

  const mockSmoldotClient = () => ({
    addChain: vi.fn().mockResolvedValue({
      remove: vi.fn().mockResolvedValue(undefined),
    }),
  });

  const mockSmoldotChain = () => ({
    remove: vi.fn().mockResolvedValue(undefined),
  });

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
    store.set(cacheMetadataAtom, false);
  });

  describe('initializeSupportedNetworksAtom', () => {
    it('should set supported networks', () => {
      const networks = [mockNetworks[0], mockNetworks[1]];
      store.set(initializeSupportedNetworksAtom, networks);

      const result = store.get(supportedNetworksAtom);
      expect(result).toEqual(networks);
    });
  });

  describe('initializeCacheMetadataAtom', () => {
    it('should set cache metadata flag', () => {
      store.set(initializeCacheMetadataAtom, true);
      expect(store.get(cacheMetadataAtom)).toBe(true);

      store.set(initializeCacheMetadataAtom, false);
      expect(store.get(cacheMetadataAtom)).toBe(false);
    });
  });

  describe('setNetworkClientAtom', () => {
    it('should add client to clients map', () => {
      const client = mockClient('polkadot');
      store.set(setNetworkClientAtom, 'polkadot', client);

      const clientsMap = store.get(clientsMapAtom);
      expect(clientsMap.get('polkadot')).toBe(client);
    });

    it('should remove client when undefined passed', () => {
      const client = mockClient('polkadot');
      store.set(setNetworkClientAtom, 'polkadot', client);

      const clientsMap1 = store.get(clientsMapAtom);
      expect(clientsMap1.get('polkadot')).toBe(client);

      store.set(setNetworkClientAtom, 'polkadot', undefined);

      const clientsMap2 = store.get(clientsMapAtom);
      expect(clientsMap2.has('polkadot')).toBe(false);
    });

    it('should not affect other clients', () => {
      const polkadotClient = mockClient('polkadot');
      const kusamaClient = mockClient('kusama');

      store.set(setNetworkClientAtom, 'polkadot', polkadotClient);
      store.set(setNetworkClientAtom, 'kusama', kusamaClient);

      let clientsMap = store.get(clientsMapAtom);
      expect(clientsMap.size).toBe(2);

      store.set(setNetworkClientAtom, 'polkadot', undefined);

      clientsMap = store.get(clientsMapAtom);
      expect(clientsMap.size).toBe(1);
      expect(clientsMap.get('kusama')).toBe(kusamaClient);
    });
  });

  describe('removeNetworkStateAtom', () => {
    it('should remove network from clients map', () => {
      const polkadotClient = mockClient('polkadot');
      const kusamaClient = mockClient('kusama');

      const initialMap = new Map();
      initialMap.set('polkadot', polkadotClient);
      initialMap.set('kusama', kusamaClient);
      store.set(clientsMapAtom, initialMap);

      store.set(removeNetworkStateAtom, 'polkadot');

      const clientsMap = store.get(clientsMapAtom);
      expect(clientsMap.has('polkadot')).toBe(false);
      expect(clientsMap.get('kusama')).toBe(kusamaClient);
    });

    it('should handle removing non-existent network', () => {
      const kusamaClient = mockClient('kusama');
      const initialMap = new Map();
      initialMap.set('kusama', kusamaClient);
      store.set(clientsMapAtom, initialMap);

      store.set(removeNetworkStateAtom, 'non-existent');

      const clientsMap = store.get(clientsMapAtom);
      expect(clientsMap.size).toBe(1);
      expect(clientsMap.get('kusama')).toBe(kusamaClient);
    });
  });

  describe('updateClientSignerAtom', () => {
    it('should handle empty clients map', () => {
      store.set(clientsMapAtom, new Map());
      store.set(externalSignerAtom, mockSigner());

      expect(() => store.get(updateClientSignerAtom)).not.toThrow();
    });
  });

  describe('cleanupAllClientsAtom', () => {
    it('should disconnect all clients and clear map', async () => {
      const polkadotClient = mockClient('polkadot');
      const kusamaClient = mockClient('kusama');

      const clientsMap = new Map();
      clientsMap.set('polkadot', polkadotClient);
      clientsMap.set('kusama', kusamaClient);
      store.set(clientsMapAtom, clientsMap);

      const connections: NetworkConnection[] = [{ networkId: 'polkadot' }, { networkId: 'kusama' }];
      store.set(networkConnectionsAtom, connections);

      await store.set(cleanupAllClientsAtom);

      expect(polkadotClient.disconnect).toHaveBeenCalled();
      expect(kusamaClient.disconnect).toHaveBeenCalled();

      const finalClientsMap = store.get(clientsMapAtom);
      expect(finalClientsMap.size).toBe(0);
    });

    it('should handle client disconnect errors gracefully', async () => {
      const polkadotClient = mockClient('polkadot', true); // Will fail on disconnect
      const kusamaClient = mockClient('kusama');

      const clientsMap = new Map();
      clientsMap.set('polkadot', polkadotClient);
      clientsMap.set('kusama', kusamaClient);
      store.set(clientsMapAtom, clientsMap);

      const connections: NetworkConnection[] = [{ networkId: 'polkadot' }, { networkId: 'kusama' }];
      store.set(networkConnectionsAtom, connections);

      // Should not throw despite polkadot client failing
      await expect(store.set(cleanupAllClientsAtom)).resolves.toBeUndefined();

      expect(polkadotClient.disconnect).toHaveBeenCalled();
      expect(kusamaClient.disconnect).toHaveBeenCalled();

      const finalClientsMap = store.get(clientsMapAtom);
      expect(finalClientsMap.size).toBe(0);
    });
  });

  describe('initializeClientsAtom', () => {
    let DedotClient: any, LegacyClient: any, WsProvider: any, SmoldotProvider: any, startWithWorker: any;

    beforeEach(async () => {
      const dedotModule = vi.mocked(await import('dedot'));
      const smoldotModule = vi.mocked(await import('dedot/smoldot/with-worker'));

      DedotClient = dedotModule.DedotClient;
      LegacyClient = dedotModule.LegacyClient;
      WsProvider = dedotModule.WsProvider;
      SmoldotProvider = dedotModule.SmoldotProvider;
      startWithWorker = smoldotModule.startWithWorker;

      DedotClient.new.mockResolvedValue(mockClient('default'));
      LegacyClient.new.mockResolvedValue(mockClient('legacy'));
      startWithWorker.mockReturnValue(mockSmoldotClient());
    });

    it('should handle no connections gracefully', async () => {
      store.set(networkConnectionsAtom, []);

      await store.set(initializeClientsAtom);

      const clientsMap = store.get(clientsMapAtom);
      expect(clientsMap.size).toBe(0);
    });

    it('should initialize client with WS provider (default)', async () => {
      const connections: NetworkConnection[] = [{ networkId: 'polkadot' }];
      store.set(networkConnectionsAtom, connections);

      const mockClientInstance = mockClient('polkadot');
      DedotClient.new.mockResolvedValue(mockClientInstance);

      await store.set(initializeClientsAtom);

      expect(WsProvider).toHaveBeenCalledWith({
        endpoint: ['wss://polkadot.api.test'],
        maxRetryAttempts: 5,
        retryDelayMs: 1500,
      });
      expect(DedotClient.new).toHaveBeenCalledWith({
        provider: expect.anything(),
        rpcVersion: 'v2',
        cacheMetadata: false,
      });

      const clientsMap = store.get(clientsMapAtom);
      expect(clientsMap.get('polkadot')).toBe(mockClientInstance);
    });

    it('should initialize client with specific WS provider', async () => {
      const connections: NetworkConnection[] = [{ networkId: 'polkadot', provider: 'wss://custom.provider.test' }];
      store.set(networkConnectionsAtom, connections);

      const mockClientInstance = mockClient('polkadot');
      DedotClient.new.mockResolvedValue(mockClientInstance);

      await store.set(initializeClientsAtom);

      expect(WsProvider).toHaveBeenCalledWith({
        endpoint: 'wss://custom.provider.test',
        maxRetryAttempts: 5,
        retryDelayMs: 1500,
      });
    });

    it('should initialize legacy client when jsonRpcApi is LEGACY', async () => {
      const connections: NetworkConnection[] = [{ networkId: 'westend' }];
      store.set(networkConnectionsAtom, connections);

      const mockClientInstance = mockClient('westend');
      DedotClient.new.mockResolvedValue(mockClientInstance);

      await store.set(initializeClientsAtom);

      expect(DedotClient.new).toHaveBeenCalledWith({
        provider: expect.anything(),
        rpcVersion: 'legacy',
        cacheMetadata: false,
      });

      const clientsMap = store.get(clientsMapAtom);
      expect(clientsMap.get('westend')).toBe(mockClientInstance);
    });

    it('should initialize light client when provider is light-client', async () => {
      const connections: NetworkConnection[] = [{ networkId: 'light-chain', provider: 'light-client' }];
      store.set(networkConnectionsAtom, connections);

      const mockChain = mockSmoldotChain();
      const mockSmoldot = mockSmoldotClient();
      mockSmoldot.addChain.mockResolvedValue(mockChain);
      startWithWorker.mockReturnValue(mockSmoldot);

      const mockClientInstance = mockClient('light-chain');
      DedotClient.new.mockResolvedValue(mockClientInstance);

      await store.set(initializeClientsAtom);

      expect(startWithWorker).toHaveBeenCalled();
      expect(mockNetworks[3].chainSpec).toHaveBeenCalled();
      expect(mockSmoldot.addChain).toHaveBeenCalledWith({
        chainSpec: 'mock-chain-spec',
      });
      expect(SmoldotProvider).toHaveBeenCalledWith(mockChain);
    });

    it('should handle light client without chainSpec', async () => {
      const connections: NetworkConnection[] = [{ networkId: 'polkadot', provider: 'light-client' }];
      store.set(networkConnectionsAtom, connections);

      await expect(store.set(initializeClientsAtom)).rejects.toThrow(
        'Network does not support light client - missing chainSpec',
      );
    });

    it('should initialize multiple clients concurrently', async () => {
      const connections: NetworkConnection[] = [
        { networkId: 'polkadot' },
        { networkId: 'kusama' },
        { networkId: 'westend' },
      ];
      store.set(networkConnectionsAtom, connections);

      const polkadotClient = mockClient('polkadot');
      const kusamaClient = mockClient('kusama');
      const westendClient = mockClient('westend');

      DedotClient.new.mockResolvedValueOnce(polkadotClient as any).mockResolvedValueOnce(kusamaClient as any);
      DedotClient.new.mockResolvedValue(westendClient);

      await store.set(initializeClientsAtom);

      const clientsMap = store.get(clientsMapAtom);
      expect(clientsMap.size).toBe(3);
      expect(clientsMap.get('polkadot')).toBe(polkadotClient);
      expect(clientsMap.get('kusama')).toBe(kusamaClient);
      expect(clientsMap.get('westend')).toBe(westendClient);
    });

    it('should cleanup existing clients before re-initialization', async () => {
      // Set up existing clients
      const existingClient = mockClient('polkadot');
      const existingMap = new Map();
      existingMap.set('polkadot', existingClient);
      store.set(clientsMapAtom, existingMap);

      const connections: NetworkConnection[] = [{ networkId: 'polkadot' }];
      store.set(networkConnectionsAtom, connections);

      const newClient = mockClient('polkadot');
      DedotClient.new.mockResolvedValue(newClient);

      await store.set(initializeClientsAtom);

      expect(existingClient.disconnect).toHaveBeenCalled();

      const clientsMap = store.get(clientsMapAtom);
      expect(clientsMap.get('polkadot')).toBe(newClient);
    });

    it('should cleanup obsolete networks not in current connections', async () => {
      // Set up existing clients for multiple networks
      const polkadotClient = mockClient('polkadot');
      const kusamaClient = mockClient('kusama');
      const westendClient = mockClient('westend');

      const existingMap = new Map();
      existingMap.set('polkadot', polkadotClient);
      existingMap.set('kusama', kusamaClient);
      existingMap.set('westend', westendClient);
      store.set(clientsMapAtom, existingMap);

      // Only initialize polkadot and kusama (westend should be cleaned up)
      const connections: NetworkConnection[] = [{ networkId: 'polkadot' }, { networkId: 'kusama' }];
      store.set(networkConnectionsAtom, connections);

      const newPolkadotClient = mockClient('polkadot');
      const newKusamaClient = mockClient('kusama');
      DedotClient.new.mockResolvedValueOnce(newPolkadotClient).mockResolvedValueOnce(newKusamaClient);

      await store.set(initializeClientsAtom);

      // Westend should be cleaned up
      expect(westendClient.disconnect).toHaveBeenCalled();

      const clientsMap = store.get(clientsMapAtom);
      expect(clientsMap.size).toBe(2);
      expect(clientsMap.has('westend')).toBe(false);
      expect(clientsMap.get('polkadot')).toBe(newPolkadotClient);
      expect(clientsMap.get('kusama')).toBe(newKusamaClient);
    });

    it('should set signer on created clients', async () => {
      const signer = mockSigner();
      store.set(externalSignerAtom, signer);

      const connections: NetworkConnection[] = [{ networkId: 'polkadot' }];
      store.set(networkConnectionsAtom, connections);

      const mockClientInstance = mockClient('polkadot');
      DedotClient.new.mockResolvedValue(mockClientInstance);

      await store.set(initializeClientsAtom);

      expect(mockClientInstance.setSigner).toHaveBeenCalledWith(signer);
    });

    it('should handle client creation errors', async () => {
      const connections: NetworkConnection[] = [{ networkId: 'polkadot' }];
      store.set(networkConnectionsAtom, connections);

      const error = new Error('Failed to create client');
      DedotClient.new.mockRejectedValue(error);

      await expect(store.set(initializeClientsAtom)).rejects.toThrow('Failed to create client');

      const clientsMap = store.get(clientsMapAtom);
      expect(clientsMap.size).toBe(0);
    });

    it('should handle network not found error', async () => {
      const connections: NetworkConnection[] = [{ networkId: 'unknown-network' }];
      store.set(networkConnectionsAtom, connections);

      // Should not throw, but log error
      await store.set(initializeClientsAtom);

      const clientsMap = store.get(clientsMapAtom);
      expect(clientsMap.size).toBe(0);
    });

    it('should use cache metadata setting', async () => {
      store.set(cacheMetadataAtom, true);

      const connections: NetworkConnection[] = [{ networkId: 'polkadot' }];
      store.set(networkConnectionsAtom, connections);

      const mockClientInstance = mockClient('polkadot');
      DedotClient.new.mockResolvedValue(mockClientInstance);

      await store.set(initializeClientsAtom);

      expect(DedotClient.new).toHaveBeenCalledWith({
        provider: expect.anything(),
        cacheMetadata: true,
        rpcVersion: 'v2',
      });
    });
  });

  describe('Integration with Client Atoms', () => {
    it('should update client ready state after initialization', async () => {
      const connections: NetworkConnection[] = [{ networkId: 'polkadot' }, { networkId: 'kusama' }];
      store.set(networkConnectionsAtom, connections);

      const polkadotClient = mockClient('polkadot');
      const kusamaClient = mockClient('kusama');

      const DedotClient = vi.mocked((await import('dedot')).DedotClient);
      DedotClient.new.mockResolvedValueOnce(polkadotClient as any).mockResolvedValueOnce(kusamaClient as any);

      // Before initialization
      expect(store.get(clientReadyAtom)).toBe(false);

      await store.set(initializeClientsAtom);

      // After initialization - all networks have clients
      expect(store.get(clientReadyAtom)).toBe(true);
    });

    it('should maintain not ready state when some clients fail to initialize', async () => {
      const connections: NetworkConnection[] = [{ networkId: 'polkadot' }, { networkId: 'kusama' }];
      store.set(networkConnectionsAtom, connections);

      const polkadotClient = mockClient('polkadot');

      const DedotClient = vi.mocked((await import('dedot')).DedotClient);
      DedotClient.new.mockResolvedValueOnce(polkadotClient as any).mockRejectedValueOnce(new Error('Kusama failed'));

      await expect(store.set(initializeClientsAtom)).rejects.toThrow('Kusama failed');

      // Should not be ready since kusama failed
      expect(store.get(clientReadyAtom)).toBe(false);
    });
  });
});
