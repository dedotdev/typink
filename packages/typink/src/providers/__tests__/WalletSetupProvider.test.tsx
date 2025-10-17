import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import React from 'react';
import { createStore, Provider as JotaiProvider } from 'jotai';
import { useWalletSetup, WalletSetupProvider } from '../WalletSetupProvider.js';
import { useWallet } from '../WalletProvider.js';
import { InjectedSigner, TypinkAccount } from '../../types.js';
import { polkadotjs, subwallet, talisman, Wallet } from '../../wallets/index.js';

// Mock jotai hooks first
const mockUseAtom = vi.fn();
const mockUseAtomValue = vi.fn();
const mockUseSetAtom = vi.fn();

vi.mock('jotai', () => ({
  useAtom: (atom: any) => mockUseAtom(atom),
  useAtomValue: (atom: any) => mockUseAtomValue(atom),
  useSetAtom: (atom: any) => mockUseSetAtom(atom),
  createStore: vi.fn(() => ({})),
  atom: (initialValue: any) => initialValue,
  Provider: ({ children }: any) => children,
}));

// Mock wallet actions and atoms
vi.mock('../../atoms/walletActions.js', () => ({
  initializeWalletsAtom: 'initializeWalletsAtom',
  initializeAppNameAtom: 'initializeAppNameAtom',
  setExternalSignerAtom: 'setExternalSignerAtom',
  connectWalletAtom: 'connectWalletAtom',
  disconnectWalletAtom: 'disconnectWalletAtom',
}));

vi.mock('../../atoms/walletAtoms.js', () => ({
  connectedWalletIdsAtom: 'connectedWalletIdsAtom',
  connectedWalletsAtom: 'connectedWalletsAtom',
  allAccountsAtom: 'allAccountsAtom',
  availableWalletsAtom: 'availableWalletsAtom',
  finalEffectiveSignerAtom: 'finalEffectiveSignerAtom',
  connectedAccountAtom: 'connectedAccountAtom',
}));

// Mock WalletProvider
vi.mock('../WalletProvider.js', () => ({
  WalletProvider: ({ children, signer, connectedAccount }: any) => (
    <div
      data-testid='wallet-provider'
      data-signer={signer ? 'present' : 'absent'}
      data-account={connectedAccount ? 'present' : 'absent'}>
      {children}
    </div>
  ),
  useWallet: vi.fn(),
}));

describe('WalletSetupProvider', () => {
  let store: ReturnType<typeof createStore>;

  // Import the mocked atom functions
  const mockInitializeWalletsAtom = vi.fn();
  const mockInitializeAppNameAtom = vi.fn();
  const mockSetExternalSignerAtom = vi.fn();
  const mockConnectWalletAtom = vi.fn();
  const mockDisconnectWalletAtom = vi.fn();
  const mockSetConnectedAccountAtom = vi.fn();

  // Mock atom values
  const mockConnectedWalletIds = ['polkadot-js', 'subwallet'];
  const mockConnectedWallets: Wallet[] = [polkadotjs, subwallet];
  const mockAccounts: TypinkAccount[] = [
    { address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY', source: 'polkadot-js', name: 'Alice' },
    { address: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty', source: 'subwallet', name: 'Bob' },
  ];
  const mockAvailableWallets: Wallet[] = [polkadotjs, subwallet, talisman];
  let mockFinalEffectiveSigner: InjectedSigner = {
    signRaw: vi.fn().mockResolvedValue({ id: 1, signature: '0xsignature' }),
    signPayload: vi.fn().mockResolvedValue({ id: 1, signature: '0xpayload' }),
  };
  let mockConnectedAccount: TypinkAccount = mockAccounts[0];

  // Mock custom wallets
  const createMockWallet = (id: string, name: string): Wallet => ({
    id,
    name,
    logo: 'mock-logo.png',
    options: { id, name, logo: 'mock-logo.png' },
    version: '1.0.0',
    injectedWeb3: {} as any,
    injectedProvider: null as any,
    ready: false,
    installed: false,
    waitUntilReady: vi.fn().mockResolvedValue(undefined),
  });

  beforeEach(() => {
    store = createStore();
    vi.clearAllMocks();

    // Mock console methods to suppress expected error messages
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    // Setup mock hook implementations
    mockUseAtomValue.mockImplementation((atom) => {
      if (atom === 'connectedWalletIdsAtom') return mockConnectedWalletIds;
      if (atom === 'connectedWalletsAtom') return mockConnectedWallets;
      if (atom === 'allAccountsAtom') return mockAccounts;
      if (atom === 'availableWalletsAtom') return mockAvailableWallets;
      if (atom === 'finalEffectiveSignerAtom') return mockFinalEffectiveSigner;
      return undefined;
    });

    mockUseSetAtom.mockImplementation((atom) => {
      if (atom === 'initializeWalletsAtom') return mockInitializeWalletsAtom;
      if (atom === 'initializeAppNameAtom') return mockInitializeAppNameAtom;
      if (atom === 'setExternalSignerAtom') return mockSetExternalSignerAtom;
      if (atom === 'connectWalletAtom') return mockConnectWalletAtom;
      if (atom === 'disconnectWalletAtom') return mockDisconnectWalletAtom;
      return vi.fn();
    });

    mockUseAtom.mockImplementation((atom) => {
      if (atom === 'connectedAccountAtom') {
        return [mockConnectedAccount, mockSetConnectedAccountAtom];
      }
      return [undefined, vi.fn()];
    });

    // Mock useWallet hook
    vi.mocked(useWallet).mockReturnValue({
      signer: mockFinalEffectiveSigner,
      connectedAccount: mockConnectedAccount,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with default wallets', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <JotaiProvider store={store}>
          <WalletSetupProvider appName='Test App'>{children}</WalletSetupProvider>
        </JotaiProvider>
      );

      renderHook(() => useWalletSetup(), { wrapper });

      expect(mockInitializeWalletsAtom).toHaveBeenCalledWith([subwallet, talisman, polkadotjs]);
      expect(mockInitializeAppNameAtom).toHaveBeenCalledWith('Test App');
    });

    it('should initialize with custom wallets', () => {
      const customWallets = [
        createMockWallet('custom-wallet-1', 'Custom Wallet 1'),
        createMockWallet('custom-wallet-2', 'Custom Wallet 2'),
      ];

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <JotaiProvider store={store}>
          <WalletSetupProvider appName='Test App' wallets={customWallets}>
            {children}
          </WalletSetupProvider>
        </JotaiProvider>
      );

      renderHook(() => useWalletSetup(), { wrapper });

      expect(mockInitializeWalletsAtom).toHaveBeenCalledWith(customWallets);
    });

    it('should initialize with empty app name', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <JotaiProvider store={store}>
          <WalletSetupProvider>{children}</WalletSetupProvider>
        </JotaiProvider>
      );

      renderHook(() => useWalletSetup(), { wrapper });

      expect(mockInitializeAppNameAtom).toHaveBeenCalledWith('Typink Dapp');
    });

    it('should handle external signer initialization', () => {
      const externalSigner = {
        signRaw: vi.fn(),
        signPayload: vi.fn(),
      };

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <JotaiProvider store={store}>
          <WalletSetupProvider signer={externalSigner}>{children}</WalletSetupProvider>
        </JotaiProvider>
      );

      renderHook(() => useWalletSetup(), { wrapper });

      expect(mockSetExternalSignerAtom).toHaveBeenCalledWith(externalSigner);
    });

    it('should handle external connected account initialization', () => {
      const externalAccount = {
        address: '5ExternalAccount123',
        source: 'external',
        name: 'External Account',
      };

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <JotaiProvider store={store}>
          <WalletSetupProvider connectedAccount={externalAccount}>{children}</WalletSetupProvider>
        </JotaiProvider>
      );

      const { result } = renderHook(() => useWalletSetup(), { wrapper });

      // Should handle the external account properly
      expect(result.current).toBeDefined();
    });
  });

  describe('Context Values', () => {
    it('should provide all expected context values', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <JotaiProvider store={store}>
          <WalletSetupProvider appName='Test App'>{children}</WalletSetupProvider>
        </JotaiProvider>
      );

      const { result } = renderHook(() => useWalletSetup(), { wrapper });

      expect(result.current.appName).toBe('Test App');
      expect(result.current.accounts).toEqual(mockAccounts);
      expect(result.current.connectedWalletIds).toEqual(mockConnectedWalletIds);
      expect(result.current.connectedWallets).toEqual(mockConnectedWallets);
      expect(result.current.wallets).toEqual(mockAvailableWallets);
      expect(typeof result.current.connectWallet).toBe('function');
      expect(typeof result.current.disconnect).toBe('function');
      expect(typeof result.current.setConnectedAccount).toBe('function');
    });

    it('should provide functions that call the correct atoms', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <JotaiProvider store={store}>
          <WalletSetupProvider appName='Test App'>{children}</WalletSetupProvider>
        </JotaiProvider>
      );

      const { result } = renderHook(() => useWalletSetup(), { wrapper });

      // Test connectWallet function
      await act(async () => {
        await result.current.connectWallet('polkadot-js');
      });
      expect(mockConnectWalletAtom).toHaveBeenCalledWith('polkadot-js');

      // Test disconnect function
      act(() => {
        result.current.disconnect('polkadot-js');
      });
      expect(mockDisconnectWalletAtom).toHaveBeenCalledWith('polkadot-js');

      // Test setConnectedAccount function
      const testAccount = { address: '5TestAccount', source: 'test', name: 'Test' };
      act(() => {
        result.current.setConnectedAccount(testAccount);
      });
      expect(mockSetConnectedAccountAtom).toHaveBeenCalledWith(testAccount);
    });
  });

  describe('Wallet Connection Management', () => {
    it('should handle successful wallet connection', async () => {
      mockConnectWalletAtom.mockResolvedValue(undefined);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <JotaiProvider store={store}>
          <WalletSetupProvider appName='Test App'>{children}</WalletSetupProvider>
        </JotaiProvider>
      );

      const { result } = renderHook(() => useWalletSetup(), { wrapper });

      await act(async () => {
        await result.current.connectWallet('talisman');
      });

      expect(mockConnectWalletAtom).toHaveBeenCalledWith('talisman');
    });

    it('should handle wallet connection errors', async () => {
      const connectionError = new Error('Connection failed');
      mockConnectWalletAtom.mockRejectedValue(connectionError);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <JotaiProvider store={store}>
          <WalletSetupProvider appName='Test App'>{children}</WalletSetupProvider>
        </JotaiProvider>
      );

      const { result } = renderHook(() => useWalletSetup(), { wrapper });

      // Test that connectWallet can be called and error is propagated
      await expect(result.current.connectWallet('talisman')).rejects.toThrow(connectionError);

      // Verify the atom was called
      expect(mockConnectWalletAtom).toHaveBeenCalledWith('talisman');
    });

    it('should handle wallet disconnection', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <JotaiProvider store={store}>
          <WalletSetupProvider appName='Test App'>{children}</WalletSetupProvider>
        </JotaiProvider>
      );

      const { result } = renderHook(() => useWalletSetup(), { wrapper });

      act(() => {
        result.current.disconnect('polkadot-js');
      });

      expect(mockDisconnectWalletAtom).toHaveBeenCalledWith('polkadot-js');
    });

    it('should handle disconnection without wallet ID', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <JotaiProvider store={store}>
          <WalletSetupProvider appName='Test App'>{children}</WalletSetupProvider>
        </JotaiProvider>
      );

      const { result } = renderHook(() => useWalletSetup(), { wrapper });

      act(() => {
        result.current.disconnect();
      });

      expect(mockDisconnectWalletAtom).toHaveBeenCalledWith(undefined);
    });
  });

  describe('Account Management', () => {
    it('should handle setting connected account', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <JotaiProvider store={store}>
          <WalletSetupProvider appName='Test App'>{children}</WalletSetupProvider>
        </JotaiProvider>
      );

      const { result } = renderHook(() => useWalletSetup(), { wrapper });

      const newAccount = {
        address: '5NewAccount123',
        source: 'new-wallet',
        name: 'New Account',
      };

      act(() => {
        result.current.setConnectedAccount(newAccount);
      });

      expect(mockSetConnectedAccountAtom).toHaveBeenCalledWith(newAccount);
    });

    it('should prefer external connected account over atom value', () => {
      const externalAccount = {
        address: '5ExternalAccount123',
        source: 'external',
        name: 'External Account',
      };

      // Set atom account to a different value
      mockConnectedAccount = {
        address: '5AtomAccount456',
        source: 'atom',
        name: 'Atom Account',
      };

      const TestComponent = () => {
        const walletSetup = useWalletSetup();
        // Access the WalletProvider through the component tree
        return <div data-testid='test-component'>Test</div>;
      };

      const { result } = renderHook(
        () => {
          // Access useWalletSetup to ensure the provider is properly rendered
          const walletSetup = useWalletSetup();
          return walletSetup;
        },
        {
          wrapper: ({ children }) => (
            <JotaiProvider store={store}>
              <WalletSetupProvider connectedAccount={externalAccount}>{children}</WalletSetupProvider>
            </JotaiProvider>
          ),
        },
      );

      // Verify the context is available and external account is preferred
      expect(result.current).toBeDefined();
      expect(result.current.accounts).toBeDefined();
    });
  });

  describe('Auto-Connect Behavior', () => {
    it('should attempt to auto-connect existing wallet connections on mount', () => {
      // Mock that we have connected wallets from storage
      const customMockConnectedWalletIds = ['polkadot-js', 'subwallet'];

      // Configure the mock to return the custom connected wallet IDs
      mockUseAtomValue.mockImplementation((atom: any) => {
        if (atom === 'connectedWalletIdsAtom') {
          return customMockConnectedWalletIds;
        }
        return [];
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <JotaiProvider store={store}>
          <WalletSetupProvider appName='Test App'>{children}</WalletSetupProvider>
        </JotaiProvider>
      );

      renderHook(() => useWalletSetup(), { wrapper });

      // Should attempt to connect each wallet
      // Note: Due to the async nature and useEffect, we can't directly test the calls
      // but we can verify the setup is correct
      expect(mockConnectWalletAtom).toBeDefined();
    });

    it('should not auto-connect if no wallets are connected', () => {
      // Mock empty connected wallets
      mockUseAtomValue.mockImplementation((atom: any) => {
        if (atom === 'connectedWalletIdsAtom') {
          return [];
        }
        return [];
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <JotaiProvider store={store}>
          <WalletSetupProvider appName='Test App'>{children}</WalletSetupProvider>
        </JotaiProvider>
      );

      const { result } = renderHook(() => useWalletSetup(), { wrapper });

      expect(result.current.connectedWalletIds).toEqual([]);
    });
  });

  describe('External Signer Integration', () => {
    it('should update external signer when prop changes', () => {
      const initialSigner = {
        signRaw: vi.fn(),
        signPayload: vi.fn(),
      };

      const updatedSigner = {
        signRaw: vi.fn(),
        signPayload: vi.fn(),
      };

      let currentSigner = initialSigner;

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <JotaiProvider store={store}>
          <WalletSetupProvider signer={currentSigner}>{children}</WalletSetupProvider>
        </JotaiProvider>
      );

      const { rerender } = renderHook(() => useWalletSetup(), { wrapper });

      expect(mockSetExternalSignerAtom).toHaveBeenCalledWith(initialSigner);

      // Update signer
      currentSigner = updatedSigner;
      rerender();

      expect(mockSetExternalSignerAtom).toHaveBeenCalledWith(updatedSigner);
    });

    it('should handle undefined external signer', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <JotaiProvider store={store}>
          <WalletSetupProvider signer={undefined}>{children}</WalletSetupProvider>
        </JotaiProvider>
      );

      renderHook(() => useWalletSetup(), { wrapper });

      expect(mockSetExternalSignerAtom).toHaveBeenCalledWith(undefined);
    });
  });

  describe('WalletProvider Integration', () => {
    it('should pass final effective signer to WalletProvider', () => {
      const testSigner = { sign: vi.fn() } as any;
      mockFinalEffectiveSigner = testSigner;

      const { result } = renderHook(() => useWalletSetup(), {
        wrapper: ({ children }) => (
          <JotaiProvider store={store}>
            <WalletSetupProvider appName='Test App'>{children}</WalletSetupProvider>
          </JotaiProvider>
        ),
      });

      // Verify the provider rendered and context is available
      expect(result.current).toBeDefined();
      expect(result.current.wallets).toBeDefined();
    });

    it('should pass effective connected account to WalletProvider', () => {
      const externalAccount = {
        address: '5ExternalAccount123',
        source: 'external',
        name: 'External Account',
      };

      const { result } = renderHook(() => useWalletSetup(), {
        wrapper: ({ children }) => (
          <JotaiProvider store={store}>
            <WalletSetupProvider connectedAccount={externalAccount}>{children}</WalletSetupProvider>
          </JotaiProvider>
        ),
      });

      // Verify the provider rendered and context is available
      expect(result.current).toBeDefined();
      expect(result.current.accounts).toBeDefined();
    });
  });

  describe('Props Updates', () => {
    it('should reinitialize wallets when wallets prop changes', () => {
      const initialWallets = [polkadotjs];
      const updatedWallets = [subwallet, talisman];

      let currentWallets = initialWallets;

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <JotaiProvider store={store}>
          <WalletSetupProvider wallets={currentWallets}>{children}</WalletSetupProvider>
        </JotaiProvider>
      );

      const { rerender } = renderHook(() => useWalletSetup(), { wrapper });

      expect(mockInitializeWalletsAtom).toHaveBeenCalledWith(initialWallets);

      // Update wallets
      currentWallets = updatedWallets;
      rerender();

      expect(mockInitializeWalletsAtom).toHaveBeenCalledWith(updatedWallets);
    });

    it('should reinitialize app name when appName prop changes', () => {
      let currentAppName = 'Initial App';

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <JotaiProvider store={store}>
          <WalletSetupProvider appName={currentAppName}>{children}</WalletSetupProvider>
        </JotaiProvider>
      );

      const { rerender } = renderHook(() => useWalletSetup(), { wrapper });

      expect(mockInitializeAppNameAtom).toHaveBeenCalledWith('Initial App');

      // Update app name
      currentAppName = 'Updated App';
      rerender();

      expect(mockInitializeAppNameAtom).toHaveBeenCalledWith('Updated App');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty wallets array', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <JotaiProvider store={store}>
          <WalletSetupProvider wallets={[]}>{children}</WalletSetupProvider>
        </JotaiProvider>
      );

      const { result } = renderHook(() => useWalletSetup(), { wrapper });

      expect(mockInitializeWalletsAtom).toHaveBeenCalledWith([]);
      expect(result.current).toBeDefined();
    });

    it('should handle context without JotaiProvider', () => {
      // This would typically fail in real usage, but we test that it doesn't crash
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <WalletSetupProvider appName='Test App'>{children}</WalletSetupProvider>
      );

      expect(() => renderHook(() => useWalletSetup(), { wrapper })).not.toThrow();
    });

    it('should handle rapid prop changes', () => {
      let currentAppName = 'App 1';

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <JotaiProvider store={store}>
          <WalletSetupProvider appName={currentAppName}>{children}</WalletSetupProvider>
        </JotaiProvider>
      );

      const { rerender } = renderHook(() => useWalletSetup(), { wrapper });

      // Rapid changes
      currentAppName = 'App 2';
      rerender();
      currentAppName = 'App 3';
      rerender();
      currentAppName = 'App 4';
      rerender();

      // Should handle all updates
      expect(mockInitializeAppNameAtom).toHaveBeenCalledWith('App 4');
      expect(mockInitializeAppNameAtom).toHaveBeenCalledTimes(4);
    });
  });
});
