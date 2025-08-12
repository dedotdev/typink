import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { useLocalStorage } from 'react-use';
import { useDeepDeps, useIsFirstRender } from '../hooks/index.js';
import { InjectedAccount, InjectedSigner, TypinkAccount } from '../types.js';
import { polkadotjs, subwallet, talisman, Wallet } from '../wallets/index.js';
import { assert } from 'dedot/utils';
import { noop, transformInjectedToTypinkAccounts } from '../utils/index.js';
import { WalletProvider, WalletProviderProps } from './WalletProvider.js';

// Data structures for multi-wallet management
interface WalletConnection {
  walletId: string;
  wallet: Wallet;
  signer: InjectedSigner;
  accounts: TypinkAccount[];
  subscription?: () => void;
}

// Split these into 2 separate context (one for setup & one for signer & connected account)
export interface WalletSetupContextProps {
  appName: string;

  // Multi-wallet support
  connectWallet: (id: string) => void;
  disconnect: (walletId?: string) => void; // Optional walletId for selective disconnect
  connectedWalletIds: string[]; // Array of connected wallet IDs
  connectedWallets: Wallet[]; // Array of connected wallet objects
  wallets: Wallet[]; // Available wallets

  // Account management
  setConnectedAccount: (account: TypinkAccount) => void;
  accounts: TypinkAccount[]; // All accounts from all connected wallets

  // Utility methods
  getAccountsByWallet: (walletId: string) => TypinkAccount[];
  isWalletConnected: (walletId: string) => boolean;
}

export const WalletSetupContext = createContext<WalletSetupContextProps>({
  appName: 'Typink Dapp',
  accounts: [],
  connectWallet: noop,
  disconnect: noop,
  connectedWalletIds: [],
  connectedWallets: [],
  wallets: [],
  setConnectedAccount: noop,
  getAccountsByWallet: () => [],
  isWalletConnected: () => false,
});

export const useWalletSetup = () => {
  return useContext(WalletSetupContext);
};

export interface WalletSetupProviderProps extends WalletProviderProps {
  appName?: string;
  wallets?: Wallet[];
}

const DEFAULT_WALLETS: Wallet[] = [subwallet, talisman, polkadotjs];

/**
 * WalletSetupProvider is a component that manages wallet setup and connection state.
 * It provides context for wallet-related operations and wraps its children with necessary providers.
 *
 * @param props - The properties for the WalletSetupProvider component.
 * @param props.children - The child components to be wrapped by this provider.
 * @param props.signer - The initial signer object for the wallet.
 * @param props.connectedAccount - The initial connected account information.
 * @param props.appName - The application name to use when enabling wallets (optional, defaults to empty string).
 */
export function WalletSetupProvider({
  children,
  signer: initialSigner,
  connectedAccount: initialConnectedAccount,
  wallets: initialWallets,
  appName = '',
}: WalletSetupProviderProps) {
  const wallets = useMemo(() => initialWallets || DEFAULT_WALLETS, useDeepDeps([initialWallets]));

  const [walletConnections, setWalletConnections] = useState<Map<string, WalletConnection>>(new Map());
  const [connectedWalletIds, setConnectedWalletIds] = useLocalStorage<string[]>('TYPINK::CONNECTED_WALLETS', []);

  const [signer, setSigner] = useState<InjectedSigner>();
  const [connectedAccount, setConnectedAccount, removeConnectedAccount] =
    useLocalStorage<TypinkAccount>('TYPINK::CONNECTED_ACCOUNT');

  const connectedWallets = useMemo(
    () => (connectedWalletIds?.map((id) => wallets.find((w) => w.id === id)).filter(Boolean) as Wallet[]) || [],
    [connectedWalletIds, wallets],
  );

  const accounts = useMemo(
    () => Array.from(walletConnections.values()).flatMap((conn) => conn.accounts),
    [walletConnections],
  );

  const getWallet = (id?: string): Wallet => wallets.find((one) => one.id === id)!;

  const getAccountsByWallet = useCallback(
    (walletId: string): TypinkAccount[] => {
      const connection = walletConnections.get(walletId);
      return connection ? connection.accounts : [];
    },
    [walletConnections],
  );

  const isWalletConnected = useCallback(
    (walletId: string): boolean => {
      return connectedWalletIds?.includes(walletId) || false;
    },
    [connectedWalletIds],
  );

  const isFirstRender = useIsFirstRender();

  useEffect(() => {
    setSigner(initialSigner);
  }, [initialSigner]);

  useEffect(() => {
    if (initialConnectedAccount) {
      setConnectedAccount(initialConnectedAccount);
    } else if (!isFirstRender) {
      // make sure we don't accidentally remove connected account on first render
      removeConnectedAccount();
    }
  }, [initialConnectedAccount]);

  // Multi-wallet connection management
  useEffect(() => {
    if (!connectedWalletIds || connectedWalletIds.length === 0) return;

    const connectToWallet = async (walletId: string) => {
      if (walletConnections.has(walletId)) return; // Already connected

      try {
        const targetWallet: Wallet = getWallet(walletId);
        assert(targetWallet, `Wallet Id Not Found ${walletId}`);

        await targetWallet.waitUntilReady();
        const injectedProvider = targetWallet.injectedProvider;
        assert(injectedProvider?.enable, `Invalid Wallet: ${targetWallet.id}`);

        const injected = await injectedProvider.enable(appName);
        const initialConnectedAccounts = await injected.accounts.get();

        if (initialConnectedAccounts.length === 0) {
          console.warn(`No accounts found for wallet: ${walletId}`);
          return;
        }

        const typinkAccounts = transformInjectedToTypinkAccounts(initialConnectedAccounts, walletId);

        // Create subscription for this wallet
        const subscription = injected.accounts.subscribe((injectedAccounts: InjectedAccount[]) => {
          const updatedTypinkAccounts = transformInjectedToTypinkAccounts(injectedAccounts, walletId);

          setWalletConnections((prev) => {
            const newConnections = new Map(prev);
            const connection = newConnections.get(walletId);
            if (connection) {
              newConnections.set(walletId, {
                ...connection,
                accounts: updatedTypinkAccounts,
              });
            }
            return newConnections;
          });
        });

        const connection: WalletConnection = {
          walletId,
          wallet: targetWallet,
          signer: injected.signer,
          accounts: typinkAccounts,
          subscription,
        };

        setWalletConnections((prev) => new Map(prev).set(walletId, connection));

        // Set first wallet as primary signer for backward compatibility
        if (connectedWalletIds.indexOf(walletId) === 0) {
          setSigner(injected.signer as any);
        }
      } catch (e) {
        console.error(`Error while connecting wallet ${walletId}:`, e);
        // Remove failed wallet from connected list
        setConnectedWalletIds((prev) => prev?.filter((id) => id !== walletId) || []);
      }
    };

    // Connect to all wallets in the list
    connectedWalletIds.forEach(connectToWallet);

    // Cleanup function
    return () => {
      walletConnections.forEach((connection) => {
        if (connection.subscription) {
          connection.subscription();
        }
      });
    };
  }, [connectedWalletIds, appName]);

  const connectWallet = useCallback(
    (walletId: string) => {
      console.log('prev wallets', connectedWalletIds);
      const newWalletIds = Array.from(new Set([...(connectedWalletIds || []), walletId]));
      setConnectedWalletIds(newWalletIds);
    },
    [connectedWalletIds],
  );

  const disconnect = useCallback(
    (walletId?: string) => {
      if (walletId) {
        // Disconnect specific wallet
        const connection = walletConnections.get(walletId);
        if (connection?.subscription) {
          connection.subscription();
        }

        setWalletConnections((prev) => {
          const newConnections = new Map(prev);
          newConnections.delete(walletId);
          return newConnections;
        });

        const newWalletIds = connectedWalletIds!.filter((id) => id !== walletId);
        setConnectedWalletIds(newWalletIds);
        walletConnections.delete(walletId);

        // If disconnecting the primary wallet, set next one as primary or clear signer
        if (connectedWalletIds?.[0] === walletId) {
          const remainingWallets = connectedWalletIds?.filter((id) => id !== walletId) || [];
          if (remainingWallets.length > 0) {
            const nextConnection = walletConnections.get(remainingWallets[0]);
            setSigner(nextConnection?.signer);
          } else {
            setSigner(undefined);
            removeConnectedAccount();
          }
        }
      } else {
        // Disconnect all wallets
        console.log('Disconnect all wallets');
        walletConnections.forEach((connection) => {
          if (connection.subscription) {
            connection.subscription();
          }
        });

        setWalletConnections(new Map());
        setConnectedWalletIds([]);
        removeConnectedAccount();
        setSigner(undefined);
      }
    },
    [connectedWalletIds, walletConnections],
  );

  return (
    <WalletSetupContext.Provider
      value={{
        // Multi-wallet support
        accounts,
        connectWallet,
        disconnect,
        connectedWalletIds: connectedWalletIds || [],
        connectedWallets,
        wallets,
        setConnectedAccount,
        getAccountsByWallet,
        isWalletConnected,

        appName,
      }}>
      <WalletProvider signer={signer} connectedAccount={connectedAccount}>
        {children}
      </WalletProvider>
    </WalletSetupContext.Provider>
  );
}
