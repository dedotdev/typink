import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { TypinkAccount } from '../types.js';
import { polkadotjs, subwallet, talisman, Wallet } from '../wallets/index.js';
import { noop } from '../utils/index.js';
import { WalletProvider, WalletProviderProps } from './WalletProvider.js';
import {
  allAccountsAtom,
  availableWalletsAtom,
  connectedAccountAtom,
  connectedWalletIdsAtom,
  connectedWalletsAtom,
  finalEffectiveSignerAtom,
} from '../atoms/walletAtoms.js';
import {
  connectWalletAtom,
  disconnectWalletAtom,
  initializeAppNameAtom,
  initializeWalletsAtom,
  setExternalSignerAtom,
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
  appName = 'Typink Dapp',
}: WalletSetupProviderProps) {
  // Initialize atoms
  const initializeWallets = useSetAtom(initializeWalletsAtom);
  const initializeAppName = useSetAtom(initializeAppNameAtom);
  const setExternalSigner = useSetAtom(setExternalSignerAtom);

  // Use atoms for state
  const connectedWalletIds = useAtomValue(connectedWalletIdsAtom);
  const connectedWallets = useAtomValue(connectedWalletsAtom);
  const accounts = useAtomValue(allAccountsAtom);
  const availableWallets = useAtomValue(availableWalletsAtom);
  const finalEffectiveSigner = useAtomValue(finalEffectiveSignerAtom);

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

  // Handle external signer from props
  useEffect(() => {
    setExternalSigner(initialSigner);
  }, [initialSigner, setExternalSigner]);

  // Handle connected account
  const [effectiveConnectedAccount, setEffectiveConnectedAccount] = useState<TypinkAccount | undefined>(
    initialConnectedAccount,
  );

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

  // Auto-connect wallets when connectedWalletIds changes (including on first load)
  useEffect(() => {
    if (connectedWalletIds.length > 0) {
      connectedWalletIds.forEach(async (walletId) => {
        try {
          await connectWallet(walletId);
        } catch (error) {
          console.error(`Failed to auto-connect wallet ${walletId}:`, error);
        }
      });
    }
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
      <WalletProvider signer={finalEffectiveSigner} connectedAccount={effectiveConnectedAccount}>
        {children}
      </WalletProvider>
    </WalletSetupContext.Provider>
  );
}
