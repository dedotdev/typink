import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WalletConnect, WalletConnectOptions } from '../WalletConnect.js';
import type { IUniversalProvider } from '@walletconnect/universal-provider';
import type { WalletConnectModal } from '@walletconnect/modal';
import type { SignClientTypes } from '@walletconnect/types';
import { SignerPayloadJSON, SignerPayloadRaw } from '../../pjs-types.js';
import { NetworkInfo, NetworkType } from '../../types.js';

// Mock the dependencies
vi.mock('@walletconnect/universal-provider', () => ({
  UniversalProvider: {
    init: vi.fn(),
  },
}));

vi.mock('@walletconnect/modal', () => ({
  WalletConnectModal: vi.fn(),
}));

describe('WalletConnect', () => {
  let walletConnect: WalletConnect;
  let mockOptions: WalletConnectOptions;
  let mockProvider: Partial<IUniversalProvider>;
  let mockModal: Partial<WalletConnectModal>;
  let mockClient: any;

  const mockNetworks: NetworkInfo[] = [
    {
      id: 'polkadot',
      type: NetworkType.MAINNET,
      name: 'Polkadot',
      logo: 'polkadot.png',
      providers: ['wss://rpc.polkadot.io'],
      symbol: 'DOT',
      decimals: 10,
      genesisHash: '0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3',
    },
    {
      id: 'kusama',
      type: NetworkType.MAINNET,
      name: 'Kusama',
      logo: 'kusama.png',
      providers: ['wss://kusama-rpc.polkadot.io'],
      symbol: 'KSM',
      decimals: 12,
      genesisHash: '0xb0a8d493285c2df73290dfb7e61f870f17b41801197a149ca93654499ea3dafe',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    mockOptions = {
      id: 'walletconnect',
      name: 'WalletConnect',
      logo: 'walletconnect.svg',
      projectId: 'test-project-id',
      metadata: {
        name: 'Test DApp',
        description: 'Test DApp Description',
        url: 'https://test.com',
        icons: ['https://test.com/icon.png'],
      },
      relayUrl: 'wss://relay.walletconnect.com',
    };

    // Mock client
    mockClient = {
      connect: vi.fn(),
      request: vi.fn(),
      on: vi.fn(),
      session: {
        get: vi.fn(),
      },
    };

    // Mock provider
    mockProvider = {
      client: mockClient,
      session: undefined,
      disconnect: vi.fn().mockResolvedValue(undefined),
    };

    // Mock modal
    mockModal = {
      openModal: vi.fn().mockResolvedValue(undefined),
      closeModal: vi.fn(),
      subscribeModal: vi.fn(),
      setTheme: vi.fn(),
    };

    walletConnect = new WalletConnect(mockOptions);
  });

  describe('Basic Properties', () => {
    it('should always be ready and installed', () => {
      expect(walletConnect.ready).toBe(true);
      expect(walletConnect.installed).toBe(true);
    });
  });

  describe('Initialization and Connection', () => {
    it('should initialize and connect with existing session', async () => {
      const { UniversalProvider } = await import('@walletconnect/universal-provider');
      const { WalletConnectModal: WCModal } = await import('@walletconnect/modal');

      vi.mocked(UniversalProvider.init).mockResolvedValue(mockProvider as any);
      vi.mocked(WCModal).mockImplementation(() => mockModal as WalletConnectModal);

      mockProvider.session = {
        topic: 'test-topic',
        namespaces: {
          polkadot: {
            accounts: ['polkadot:91b171bb158e2d3848fa23a9f1c25182:5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY'],
            chains: ['polkadot:91b171bb158e2d3848fa23a9f1c25182'],
            methods: ['polkadot_signTransaction'],
            events: [],
          },
        },
      } as any;

      walletConnect.setSupportedNetworks(mockNetworks);
      await walletConnect.waitUntilReady();

      expect(UniversalProvider.init).toHaveBeenCalledWith({
        projectId: mockOptions.projectId,
        relayUrl: mockOptions.relayUrl,
        metadata: mockOptions.metadata,
      });
      expect(walletConnect.injectedProvider).toBeDefined();
    });

    it('should establish new connection when no existing session', async () => {
      const { UniversalProvider } = await import('@walletconnect/universal-provider');
      const { WalletConnectModal: WCModal } = await import('@walletconnect/modal');

      vi.mocked(UniversalProvider.init).mockResolvedValue(mockProvider as any);
      vi.mocked(WCModal).mockImplementation(() => mockModal as WalletConnectModal);

      const mockSession = {
        topic: 'test-topic',
        namespaces: {
          polkadot: {
            accounts: ['polkadot:91b171bb158e2d3848fa23a9f1c25182:5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY'],
            chains: ['polkadot:91b171bb158e2d3848fa23a9f1c25182'],
            methods: ['polkadot_signTransaction'],
            events: [],
          },
        },
      };

      mockClient.connect.mockResolvedValue({
        uri: 'wc:test-uri',
        approval: vi.fn().mockResolvedValue(mockSession),
      });

      walletConnect.setSupportedNetworks(mockNetworks);
      await walletConnect.waitUntilReady();

      expect(mockClient.connect).toHaveBeenCalledWith({
        optionalNamespaces: {
          polkadot: {
            chains: expect.any(Array),
            methods: [
              'polkadot_signMessage',
              'polkadot_sendTransaction',
              'polkadot_signTransaction',
              'polkadot_requestAccounts',
            ],
            events: ['accountsChanged', 'chainChanged', 'connect'],
          },
        },
      });
      expect(mockModal.openModal).toHaveBeenCalledWith({ uri: 'wc:test-uri' });
      expect(mockModal.closeModal).toHaveBeenCalled();
    });

    it('should throw error when projectId is missing', async () => {
      const invalidOptions = { ...mockOptions, projectId: '' };
      const invalidWallet = new WalletConnect(invalidOptions);

      await expect(invalidWallet.waitUntilReady()).rejects.toThrow();
    });

    it('should throw error when provider initialization fails', async () => {
      const { UniversalProvider } = await import('@walletconnect/universal-provider');
      vi.mocked(UniversalProvider.init).mockRejectedValue(new Error('Init failed'));

      await expect(walletConnect.waitUntilReady()).rejects.toThrow('Failed to initialize WalletConnect: Init failed');
    });

    it('should handle user closing modal', async () => {
      const { UniversalProvider } = await import('@walletconnect/universal-provider');
      const { WalletConnectModal: WCModal } = await import('@walletconnect/modal');

      vi.mocked(UniversalProvider.init).mockResolvedValue(mockProvider as any);

      let modalCallback: (state: { open: boolean }) => void;
      mockModal.subscribeModal = vi.fn().mockImplementation((cb) => {
        modalCallback = cb;
      });

      vi.mocked(WCModal).mockImplementation(() => mockModal as WalletConnectModal);

      mockClient.connect.mockResolvedValue({
        uri: 'wc:test-uri',
        approval: vi.fn().mockImplementation(
          () =>
            new Promise((resolve) => {
              setTimeout(() => resolve({ topic: 'test' }), 1000);
            }),
        ),
      });

      walletConnect.setSupportedNetworks(mockNetworks);

      const connectPromise = walletConnect.waitUntilReady();

      await new Promise((resolve) => setTimeout(resolve, 10));
      modalCallback!({ open: false });

      await expect(connectPromise).rejects.toThrow('Failed to connect WalletConnect: User closed WalletConnect modal');
    });
  });

  describe('Disconnect', () => {
    it('should disconnect and cleanup state', async () => {
      const { UniversalProvider } = await import('@walletconnect/universal-provider');
      const { WalletConnectModal: WCModal } = await import('@walletconnect/modal');

      vi.mocked(UniversalProvider.init).mockResolvedValue(mockProvider as any);
      vi.mocked(WCModal).mockImplementation(() => mockModal as WalletConnectModal);

      mockProvider.session = {
        topic: 'test-topic',
        namespaces: {
          polkadot: {
            accounts: ['polkadot:91b171bb158e2d3848fa23a9f1c25182:5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY'],
            chains: [],
            methods: [],
            events: [],
          },
        },
      } as any;

      walletConnect.setSupportedNetworks(mockNetworks);
      await walletConnect.waitUntilReady();

      await walletConnect.disconnect();

      expect(mockProvider.disconnect).toHaveBeenCalled();
      expect(walletConnect.provider).toBeUndefined();
      expect(walletConnect.injectedProvider).toBeUndefined();
    });

    it('should handle disconnect errors gracefully', async () => {
      const { UniversalProvider } = await import('@walletconnect/universal-provider');
      const { WalletConnectModal: WCModal } = await import('@walletconnect/modal');

      mockProvider.disconnect = vi.fn().mockRejectedValue(new Error('Disconnect failed'));

      vi.mocked(UniversalProvider.init).mockResolvedValue(mockProvider as any);
      vi.mocked(WCModal).mockImplementation(() => mockModal as WalletConnectModal);

      mockProvider.session = {
        topic: 'test-topic',
        namespaces: {
          polkadot: {
            accounts: ['polkadot:91b171bb158e2d3848fa23a9f1c25182:5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY'],
            chains: [],
            methods: [],
            events: [],
          },
        },
      } as any;

      walletConnect.setSupportedNetworks(mockNetworks);
      await walletConnect.waitUntilReady();

      await expect(walletConnect.disconnect()).resolves.toBeUndefined();
      expect(walletConnect.provider).toBeUndefined();
    });
  });

  describe('InjectedProvider', () => {
    beforeEach(async () => {
      const { UniversalProvider } = await import('@walletconnect/universal-provider');
      const { WalletConnectModal: WCModal } = await import('@walletconnect/modal');

      vi.mocked(UniversalProvider.init).mockResolvedValue(mockProvider as any);
      vi.mocked(WCModal).mockImplementation(() => mockModal as WalletConnectModal);

      mockProvider.session = {
        topic: 'test-topic',
        namespaces: {
          polkadot: {
            accounts: [
              'polkadot:91b171bb158e2d3848fa23a9f1c25182:5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
              'polkadot:91b171bb158e2d3848fa23a9f1c25182:5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
            ],
            chains: ['polkadot:91b171bb158e2d3848fa23a9f1c25182'],
            methods: ['polkadot_signTransaction'],
            events: [],
          },
        },
      } as any;

      walletConnect.setSupportedNetworks(mockNetworks);
      await walletConnect.waitUntilReady();
    });

    it('should provide enable method and version', async () => {
      const injectedProvider = walletConnect.injectedProvider!;

      expect(injectedProvider.enable).toBeDefined();
      expect(typeof injectedProvider.enable).toBe('function');
      expect(injectedProvider.version).toBeDefined();
    });

    it('should enable and return accounts and signer', async () => {
      const injectedProvider = walletConnect.injectedProvider!;
      const result = await injectedProvider.enable!('test-origin');

      expect(result.accounts).toBeDefined();
      expect(result.signer).toBeDefined();

      const accountList = await result.accounts.get();
      expect(accountList).toHaveLength(2);
      expect(accountList[0].address).toBe('5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY');
    });

    it('should support account subscription', async () => {
      const injectedProvider = walletConnect.injectedProvider!;
      const { accounts } = await injectedProvider.enable!('test-origin');

      const callback = vi.fn();
      const unsubscribe = accounts.subscribe(callback);

      expect(callback).toHaveBeenCalled();
      expect(typeof unsubscribe).toBe('function');
    });

    it('should sign transaction payload', async () => {
      const injectedProvider = walletConnect.injectedProvider!;
      const { signer } = await injectedProvider.enable!('test-origin');

      const payload: SignerPayloadJSON = {
        address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
        blockHash: '0x1234',
        blockNumber: '0x01',
        era: '0x00',
        genesisHash: '0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3',
        method: '0xabcd',
        nonce: '0x00',
        specVersion: '0x01',
        tip: '0x00',
        transactionVersion: '0x01',
        signedExtensions: [],
        version: 4,
      };

      mockClient.request.mockResolvedValue({ signature: '0xmocksignature' });

      const result = await signer.signPayload!(payload);

      expect(mockClient.request).toHaveBeenCalledWith({
        topic: 'test-topic',
        chainId: expect.stringContaining('polkadot:'),
        request: {
          method: 'polkadot_signTransaction',
          params: {
            address: payload.address,
            transactionPayload: payload,
          },
        },
      });
      expect(result.signature).toBe('0xmocksignature');
    });

    it('should sign raw message', async () => {
      const injectedProvider = walletConnect.injectedProvider!;
      const { signer } = await injectedProvider.enable!('test-origin');

      const raw: SignerPayloadRaw = {
        address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
        data: '0x1234567890',
        type: 'bytes',
      };

      mockClient.request.mockResolvedValue({ signature: '0xrawsignature' });

      const result = await signer.signRaw!(raw);

      expect(mockClient.request).toHaveBeenCalledWith({
        topic: 'test-topic',
        chainId: expect.stringContaining('polkadot:'),
        request: {
          method: 'polkadot_signMessage',
          params: {
            address: raw.address,
            message: raw.data,
            type: raw.type,
          },
        },
      });
      expect(result.signature).toBe('0xrawsignature');
    });

    it('should handle signing errors', async () => {
      const injectedProvider = walletConnect.injectedProvider!;
      const { signer } = await injectedProvider.enable!('test-origin');

      const payload: SignerPayloadJSON = {
        address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
        blockHash: '0x1234',
        blockNumber: '0x01',
        era: '0x00',
        genesisHash: '0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3',
        method: '0xabcd',
        nonce: '0x00',
        specVersion: '0x01',
        tip: '0x00',
        transactionVersion: '0x01',
        signedExtensions: [],
        version: 4,
      };

      mockClient.request.mockRejectedValue(new Error('User rejected'));

      await expect(signer.signPayload!(payload)).rejects.toThrow(
        'Failed to sign payload with WalletConnect: User rejected',
      );
    });
  });

  describe('Session Events', () => {
    let sessionUpdateCallback: (args: SignClientTypes.EventArguments['session_update']) => void;
    let sessionDeleteCallback: () => void;

    beforeEach(async () => {
      const { UniversalProvider } = await import('@walletconnect/universal-provider');
      const { WalletConnectModal: WCModal } = await import('@walletconnect/modal');

      mockClient.on = vi.fn().mockImplementation((event: string, callback: any) => {
        if (event === 'session_update') {
          sessionUpdateCallback = callback;
        } else if (event === 'session_delete') {
          sessionDeleteCallback = callback;
        }
      });

      vi.mocked(UniversalProvider.init).mockResolvedValue(mockProvider as any);
      vi.mocked(WCModal).mockImplementation(() => mockModal as WalletConnectModal);

      mockProvider.session = {
        topic: 'test-topic',
        namespaces: {
          polkadot: {
            accounts: ['polkadot:91b171bb158e2d3848fa23a9f1c25182:5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY'],
            chains: ['polkadot:91b171bb158e2d3848fa23a9f1c25182'],
            methods: ['polkadot_signTransaction'],
            events: [],
          },
        },
      } as any;

      walletConnect.setSupportedNetworks(mockNetworks);
      await walletConnect.waitUntilReady();
    });

    it('should handle session_update event', async () => {
      const injectedProvider = walletConnect.injectedProvider!;
      const { accounts } = await injectedProvider.enable!('test-origin');

      const callback = vi.fn();
      accounts.subscribe(callback);
      callback.mockClear();

      const newNamespaces = {
        polkadot: {
          accounts: [
            'polkadot:91b171bb158e2d3848fa23a9f1c25182:5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
            'polkadot:91b171bb158e2d3848fa23a9f1c25182:5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
          ],
          chains: ['polkadot:91b171bb158e2d3848fa23a9f1c25182'],
          methods: ['polkadot_signTransaction'],
          events: [],
        },
      };

      mockClient.session.get.mockReturnValue({
        topic: 'test-topic',
        namespaces: newNamespaces,
      });

      sessionUpdateCallback({
        id: 1,
        topic: 'test-topic',
        params: { namespaces: newNamespaces },
      });

      expect(callback).toHaveBeenCalled();
      const calledAccounts = callback.mock.calls[0][0];
      expect(calledAccounts).toHaveLength(2);
    });

    it('should handle session_delete event', async () => {
      const injectedProvider = walletConnect.injectedProvider!;
      const { accounts } = await injectedProvider.enable!('test-origin');

      const callback = vi.fn();
      accounts.subscribe(callback);
      callback.mockClear();

      sessionDeleteCallback();

      expect(callback).toHaveBeenCalledWith([]);
      expect(walletConnect.injectedProvider).toBeUndefined();
    });
  });
});
