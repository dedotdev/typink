import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { InjectedSigner, TypinkAccount } from '../types.js';
import { polkadotjs, subwallet, talisman, Wallet } from '../wallets/index.js';
import { noop } from '../utils/index.js';
import { WalletProvider, WalletProviderProps } from './WalletProvider.js';
import {
  connectedWalletIdsAtom,
  connectedAccountAtom,
  connectedWalletsAtom,
  allAccountsAtom,
  primarySignerAtom,
  availableWalletsAtom,
} from '../atoms/walletAtoms.js';
import {
  connectWalletAtom,
  disconnectWalletAtom,
  initializeWalletsAtom,
  initializeAppNameAtom,
} from '../atoms/walletActions.js';

// Split these into 2 separate context (one for setup & one for signer & connected account)
export interface WalletSetupContextProps {
  appName: string;

  // Multi-wallet support
  connectWallet: (id: string) => Promise<void>;
  disconnect: (walletId?: string) => void;
  connectedWalletIds: string[]; // Array of connected wallet IDs
  connectedWallets: Wallet[]; // Array of connected wallet objects
  wallets: Wallet[]; // Available wallets

  // Account management
  setConnectedAccount: (account: TypinkAccount) => void;
  accounts: TypinkAccount[]; // All accounts from all connected wallets

}

export const WalletSetupContext = createContext<WalletSetupContextProps>({
  appName: 'Typink Dapp',
  accounts: [],
  connectWallet: () => Promise.reject(),
  disconnect: noop,
  connectedWalletIds: [],
  connectedWallets: [],
  wallets: [],
  setConnectedAccount: noop,
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
  // Initialize atoms
  const initializeWallets = useSetAtom(initializeWalletsAtom);
  const initializeAppName = useSetAtom(initializeAppNameAtom);

  // Use atoms for state
  const connectedWalletIds = useAtomValue(connectedWalletIdsAtom);
  const connectedWallets = useAtomValue(connectedWalletsAtom);
  const accounts = useAtomValue(allAccountsAtom);
  const availableWallets = useAtomValue(availableWalletsAtom);
  const primarySigner = useAtomValue(primarySignerAtom);

  // Use atom actions
  const connectWallet = useSetAtom(connectWalletAtom);
  const disconnectWallet = useSetAtom(disconnectWalletAtom);
  const [connectedAccount, setConnectedAccount] = useAtom(connectedAccountAtom);

  // Initialize wallets and app name
  useEffect(() => {
    const walletsToUse = initialWallets || DEFAULT_WALLETS;
    initializeWallets(walletsToUse);
  }, [initialWallets, initializeWallets]);

  useEffect(() => {
    initializeAppName(appName);
  }, [appName, initializeAppName]);

  // Handle initial signer and connected account
  const [effectiveSigner, setEffectiveSigner] = useState<InjectedSigner | undefined>(initialSigner);
  const [effectiveConnectedAccount, setEffectiveConnectedAccount] = useState<TypinkAccount | undefined>(
    initialConnectedAccount,
  );

  useEffect(() => {
    // Use provided signer or fall back to primary signer from connected wallets
    setEffectiveSigner(initialSigner || primarySigner);
  }, [initialSigner, primarySigner]);

  useEffect(() => {
    // Use provided connected account or fall back to Jotai atom
    setEffectiveConnectedAccount(initialConnectedAccount || connectedAccount);
  }, [initialConnectedAccount, connectedAccount]);


  const handleDisconnect = useCallback(
    (walletId?: string) => {
      disconnectWallet(walletId);
    },
    [disconnectWallet],
  );

  const handleSetConnectedAccount = useCallback(
    (account: TypinkAccount) => {
      setConnectedAccount(account);
    },
    [setConnectedAccount],
  );

  // Auto-connect wallets on mount
  useEffect(() => {
    connectedWalletIds.forEach(async (walletId) => {
      await connectWallet(walletId);
    });
  }, []);

  return (
    <WalletSetupContext.Provider
      value={{
        accounts,
        connectWallet,
        disconnect: handleDisconnect,
        connectedWalletIds,
        connectedWallets,
        wallets: availableWallets,
        setConnectedAccount: handleSetConnectedAccount,

        appName,
      }}>
      <WalletProvider signer={effectiveSigner} connectedAccount={effectiveConnectedAccount}>
        {children}
      </WalletProvider>
    </WalletSetupContext.Provider>
  );
}
