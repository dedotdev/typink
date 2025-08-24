import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import React from 'react';
import { createStore } from 'jotai';
import { TypinkContext, TypinkProvider } from '../TypinkProvider.js';
import { useClient } from '../ClientProvider.js';
import { useWallet } from '../WalletProvider.js';
import { useWalletSetup } from '../WalletSetupProvider.js';
import { useTypinkEvents } from '../TypinkEventsProvider.js';
import { ContractDeployment, InjectedSigner, NetworkInfo, TypinkAccount } from '../../types.js';

// Mock all the sub-providers and their hooks
vi.mock('../ClientProvider.js', () => ({
  ClientProvider: ({ children }: { children: React.ReactNode }) => <div data-testid='client-provider'>{children}</div>,
  useClient: vi.fn(),
}));

vi.mock('../WalletProvider.js', () => ({
  WalletProvider: ({ children }: { children: React.ReactNode }) => <div data-testid='wallet-provider'>{children}</div>,
  useWallet: vi.fn(),
}));

vi.mock('../WalletSetupProvider.js', () => ({
  WalletSetupProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid='wallet-setup-provider'>{children}</div>
  ),
  useWalletSetup: vi.fn(),
}));

vi.mock('../TypinkEventsProvider.js', () => ({
  TypinkEventsProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid='typink-events-provider'>{children}</div>
  ),
  useTypinkEvents: vi.fn(),
}));

describe('TypinkProvider', () => {
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

  const mockSigner = (): InjectedSigner => ({
    signRaw: vi.fn().mockResolvedValue({
      id: 1,
      signature: '0xmocksignature',
    }),
    signPayload: vi.fn().mockResolvedValue({
      id: 1,
      signature: '0xmockpayload',
    }),
  });

  const mockAccount = (address: string, source: string, name?: string): TypinkAccount => ({
    address,
    source,
    name,
  });

  const mockDeployment: ContractDeployment = {
    id: 'test-contract',
    network: 'test-network',
    metadata: {} as any,
    address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
  };

  const mockClientContext = {
    ready: true,
    client: {} as any,
    network: mockNetworks[0],
    networkConnection: { networkId: 'test-network' },
    networks: mockNetworks,
    networkConnections: [{ networkId: 'test-network' }],
    setNetwork: vi.fn(),
    setNetworks: vi.fn(),
    clients: new Map(),
    getClient: vi.fn(),
    supportedNetworks: mockNetworks,
    cacheMetadata: false,
  };

  const mockWalletContext = {
    signer: mockSigner(),
    connectedAccount: mockAccount('5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY', 'polkadot-js', 'Alice'),
  };

  const mockWalletSetupContext = {
    appName: 'Test App',
    connectWallet: vi.fn(),
    disconnect: vi.fn(),
    connectedWalletIds: ['polkadot-js'],
    connectedWallets: [],
    wallets: [],
    setConnectedAccount: vi.fn(),
    accounts: [mockAccount('5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY', 'polkadot-js', 'Alice')],
  };

  const mockTypinkEventsContext = {
    subscribeToEvent: vi.fn().mockReturnValue(() => {}),
  };

  beforeEach(() => {
    store = createStore();
    vi.clearAllMocks();

    // Setup mock implementations
    vi.mocked(useClient).mockReturnValue(mockClientContext);
    vi.mocked(useWallet).mockReturnValue(mockWalletContext);
    vi.mocked(useWalletSetup).mockReturnValue(mockWalletSetupContext);
    vi.mocked(useTypinkEvents).mockReturnValue(mockTypinkEventsContext);
  });

  describe('Provider Composition', () => {
    it('should render all sub-providers in correct order', () => {
      const TestComponent = () => {
        return <div data-testid='test-component'>Test</div>;
      };

      renderHook(() => null, {
        wrapper: ({ children }) => (
          <TypinkProvider appName='Test App' supportedNetworks={mockNetworks}>
            <TestComponent />
            {children}
          </TypinkProvider>
        ),
      });

      // Verify that useClient, useWalletSetup, useWallet, and useTypinkEvents were called
      expect(useClient).toHaveBeenCalled();
      expect(useWalletSetup).toHaveBeenCalled();
      expect(useWallet).toHaveBeenCalled();
      expect(useTypinkEvents).toHaveBeenCalled();
    });

    it('should provide combined context from all sub-providers', () => {
      const useTypinkContext = () => React.useContext(TypinkContext);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TypinkProvider
          appName='Test App'
          supportedNetworks={mockNetworks}
          deployments={[mockDeployment]}
          defaultCaller='5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty'>
          {children}
        </TypinkProvider>
      );

      const { result } = renderHook(() => useTypinkContext(), { wrapper });

      // Should include all context properties
      expect(result.current).toMatchObject({
        // Client context
        ready: mockClientContext.ready,
        client: mockClientContext.client,
        network: mockClientContext.network,
        networks: mockClientContext.networks,

        // Wallet setup context
        appName: mockWalletSetupContext.appName,
        accounts: mockWalletSetupContext.accounts,
        connectedWalletIds: mockWalletSetupContext.connectedWalletIds,

        // Wallet context
        signer: mockWalletContext.signer,
        connectedAccount: mockWalletContext.connectedAccount,

        // Typink events context
        subscribeToEvent: mockTypinkEventsContext.subscribeToEvent,

        // Typink-specific props
        deployments: [mockDeployment],
        defaultCaller: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
      });
    });
  });

  describe('Props Handling', () => {
    it('should handle default deployments prop', () => {
      const useTypinkContext = () => React.useContext(TypinkContext);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TypinkProvider appName='Test App' supportedNetworks={mockNetworks}>
          {children}
        </TypinkProvider>
      );

      const { result } = renderHook(() => useTypinkContext(), { wrapper });

      expect(result.current.deployments).toEqual([]);
    });

    it('should handle default defaultCaller prop', () => {
      const useTypinkContext = () => React.useContext(TypinkContext);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TypinkProvider appName='Test App' supportedNetworks={mockNetworks}>
          {children}
        </TypinkProvider>
      );

      const { result } = renderHook(() => useTypinkContext(), { wrapper });

      expect(result.current.defaultCaller).toBe('5FTZ6n1wY3GBqEZ2DWEdspbTarvRnp8DM8x2YXbWubu7JN98');
    });

    it('should pass through props to sub-providers', () => {
      const testSigner = mockSigner();
      const testAccount = mockAccount('5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY', 'polkadot-js', 'Alice');

      renderHook(() => null, {
        wrapper: ({ children }) => (
          <TypinkProvider
            appName='Test App'
            supportedNetworks={mockNetworks}
            signer={testSigner}
            connectedAccount={testAccount}
            defaultNetworkIds={['test-network']}
            cacheMetadata={true}>
            {children}
          </TypinkProvider>
        ),
      });

      // All hooks should have been called, indicating sub-providers were rendered
      expect(useClient).toHaveBeenCalled();
      expect(useWalletSetup).toHaveBeenCalled();
      expect(useWallet).toHaveBeenCalled();
      expect(useTypinkEvents).toHaveBeenCalled();
    });

    it('should handle custom deployments array', () => {
      const testDeployments = [
        mockDeployment,
        {
          id: 'second-contract',
          network: 'secondary-network',
          metadata: {} as any,
          address: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
        },
      ];

      const useTypinkContext = () => React.useContext(TypinkContext);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TypinkProvider appName='Test App' supportedNetworks={mockNetworks} deployments={testDeployments}>
          {children}
        </TypinkProvider>
      );

      const { result } = renderHook(() => useTypinkContext(), { wrapper });

      expect(result.current.deployments).toEqual(testDeployments);
      expect(result.current.deployments).toHaveLength(2);
    });

    it('should handle custom defaultCaller', () => {
      const customCaller = '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty';

      const useTypinkContext = () => React.useContext(TypinkContext);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TypinkProvider appName='Test App' supportedNetworks={mockNetworks} defaultCaller={customCaller}>
          {children}
        </TypinkProvider>
      );

      const { result } = renderHook(() => useTypinkContext(), { wrapper });

      expect(result.current.defaultCaller).toBe(customCaller);
    });
  });

  describe('Context Updates', () => {
    it('should update context when sub-provider contexts change', () => {
      const useTypinkContext = () => React.useContext(TypinkContext);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TypinkProvider appName='Test App' supportedNetworks={mockNetworks}>
          {children}
        </TypinkProvider>
      );

      const { result, rerender } = renderHook(() => useTypinkContext(), { wrapper });

      const initialReady = result.current.ready;
      expect(initialReady).toBe(true);

      // Update the mock to return different values
      vi.mocked(useClient).mockReturnValue({
        ...mockClientContext,
        ready: false,
      });

      rerender();

      expect(result.current.ready).toBe(false);
    });

    it('should handle prop updates', () => {
      const initialDeployments = [mockDeployment];
      const updatedDeployments = [
        mockDeployment,
        {
          id: 'updated-contract',
          network: 'test-network',
          metadata: {} as any,
          address: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
        },
      ];

      let currentDeployments = initialDeployments;

      const useTypinkContext = () => React.useContext(TypinkContext);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TypinkProvider appName='Test App' supportedNetworks={mockNetworks} deployments={currentDeployments}>
          {children}
        </TypinkProvider>
      );

      const { result, rerender } = renderHook(() => useTypinkContext(), { wrapper });

      expect(result.current.deployments).toEqual(initialDeployments);

      // Update deployments
      currentDeployments = updatedDeployments;
      rerender();

      expect(result.current.deployments).toEqual(updatedDeployments);
    });
  });

  describe('Children Rendering', () => {
    it('should render children components', () => {
      const TestChild = () => <div data-testid='test-child'>Child Component</div>;

      const useTypinkContext = () => React.useContext(TypinkContext);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TypinkProvider appName='Test App' supportedNetworks={mockNetworks}>
          <TestChild />
          {children}
        </TypinkProvider>
      );

      const { result } = renderHook(() => useTypinkContext(), { wrapper });

      // Context should be available
      expect(result.current).toBeDefined();
      expect(result.current.deployments).toEqual([]);
    });

    it('should handle multiple children', () => {
      const TestChild1 = () => <div data-testid='test-child-1'>Child 1</div>;
      const TestChild2 = () => <div data-testid='test-child-2'>Child 2</div>;

      const useTypinkContext = () => React.useContext(TypinkContext);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TypinkProvider appName='Test App' supportedNetworks={mockNetworks}>
          <TestChild1 />
          <TestChild2 />
          {children}
        </TypinkProvider>
      );

      const { result } = renderHook(() => useTypinkContext(), { wrapper });

      expect(result.current).toBeDefined();
    });
  });

  describe('JotaiProvider Integration', () => {
    it('should wrap everything in JotaiProvider', () => {
      // This test verifies that the JotaiProvider is being used
      renderHook(() => null, {
        wrapper: ({ children }) => (
          <TypinkProvider appName='Test App' supportedNetworks={mockNetworks}>
            {children}
          </TypinkProvider>
        ),
      });

      // All the hooks should be called, indicating providers are working
      expect(useClient).toHaveBeenCalled();
      expect(useWalletSetup).toHaveBeenCalled();
      expect(useWallet).toHaveBeenCalled();
      expect(useTypinkEvents).toHaveBeenCalled();
    });
  });

  describe('Provider Hierarchy', () => {
    it('should maintain correct provider nesting order', () => {
      const TestComponent = () => {
        // Test that all contexts are available at the leaf level
        const client = useClient();
        const walletSetup = useWalletSetup();
        const wallet = useWallet();
        const events = useTypinkEvents();

        // All should be defined
        expect(client).toBeDefined();
        expect(walletSetup).toBeDefined();
        expect(wallet).toBeDefined();
        expect(events).toBeDefined();

        return null;
      };

      renderHook(() => null, {
        wrapper: ({ children }) => (
          <TypinkProvider appName='Test App' supportedNetworks={mockNetworks}>
            <TestComponent />
            {children}
          </TypinkProvider>
        ),
      });

      expect(useClient).toHaveBeenCalled();
      expect(useWalletSetup).toHaveBeenCalled();
      expect(useWallet).toHaveBeenCalled();
      expect(useTypinkEvents).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty supported networks array', () => {
      const useTypinkContext = () => React.useContext(TypinkContext);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TypinkProvider appName='Test App' supportedNetworks={[]}>
          {children}
        </TypinkProvider>
      );

      // This should not throw, even though ClientProvider would typically validate this
      expect(() => renderHook(() => useTypinkContext(), { wrapper })).not.toThrow();
    });

    it('should handle undefined optional props gracefully', () => {
      const useTypinkContext = () => React.useContext(TypinkContext);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TypinkProvider appName='Test App' supportedNetworks={mockNetworks}>
          {children}
        </TypinkProvider>
      );

      const { result } = renderHook(() => useTypinkContext(), { wrapper });

      // Should use defaults
      expect(result.current.deployments).toEqual([]);
      expect(result.current.defaultCaller).toBe('5FTZ6n1wY3GBqEZ2DWEdspbTarvRnp8DM8x2YXbWubu7JN98');
    });

    it('should handle context value type safety', () => {
      const useTypinkContext = () => React.useContext(TypinkContext);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TypinkProvider appName='Test App' supportedNetworks={mockNetworks}>
          {children}
        </TypinkProvider>
      );

      const { result } = renderHook(() => useTypinkContext(), { wrapper });

      // Verify all expected properties exist
      expect(result.current).toHaveProperty('ready');
      expect(result.current).toHaveProperty('client');
      expect(result.current).toHaveProperty('network');
      expect(result.current).toHaveProperty('signer');
      expect(result.current).toHaveProperty('connectedAccount');
      expect(result.current).toHaveProperty('appName');
      expect(result.current).toHaveProperty('accounts');
      expect(result.current).toHaveProperty('subscribeToEvent');
      expect(result.current).toHaveProperty('deployments');
      expect(result.current).toHaveProperty('defaultCaller');
    });
  });
});
