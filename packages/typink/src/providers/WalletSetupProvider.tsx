import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useLocalStorage } from 'react-use';
import { useDeepDeps, useIsFirstRender } from '../hooks/index.js';
import { InjectedAccount, InjectedSigner, TypinkAccount } from '../types.js';
import { polkadotjs, subwallet, talisman, Wallet, ExtensionWallet, LedgerWallet } from '../wallets/index.js';
import { assert } from 'dedot/utils';
import { noop } from '../utils/index.js';
import { WalletProvider, WalletProviderProps } from './WalletProvider.js';
import { useLedger } from './LedgerProvider.js';
import { LedgerConnect } from '../signers/index.js';

// Split these into 2 separate context (one for setup & one for signer & connected account)
export interface WalletSetupContextProps {
  appName: string;

  // for setting up wallets
  connectWallet: (id: string) => void;
  disconnect: () => void;
  connectedWalletId?: string;
  connectedWallet?: Wallet;
  wallets: Wallet[]; // custom available wallets

  setConnectedAccount: (account: TypinkAccount) => void;
  accounts: TypinkAccount[];
}

export const WalletSetupContext = createContext<WalletSetupContextProps>({
  appName: 'Typink Dapp',
  accounts: [],
  connectWallet: noop,
  disconnect: noop,
  setConnectedAccount: noop,
  wallets: [],
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
  appName = ''
}: WalletSetupProviderProps) {
  const wallets = useMemo(() => initialWallets || DEFAULT_WALLETS, useDeepDeps([initialWallets]));
  const [accounts, setAccounts] = useState<TypinkAccount[]>([]);

  const [connectedWalletId, setConnectedWalletId, removeConnectedWalletId] =
    useLocalStorage<string>('TYPINK::CONNECTED_WALLET');

  const [signer, setSigner] = useState<InjectedSigner>();
  const [connectedAccount, setConnectedAccount, removeConnectedAccount] =
    useLocalStorage<TypinkAccount>('TYPINK::CONNECTED_ACCOUNT');

  const getWallet = (id?: string): Wallet => wallets.find((one) => one.id === id)!;

  const connectedWallet = useMemo(() => getWallet(connectedWalletId), [connectedWalletId]);

  const isFirstRender = useIsFirstRender();
  
  // Try to get ledger context if LedgerProvider is available
  let ledgerContext: ReturnType<typeof useLedger> | null = null;
  try {
    ledgerContext = useLedger();
  } catch {
    // LedgerProvider not available, that's ok
  }

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

  useEffect(() => {
    if (!connectedWalletId) return;

    let unsub: () => void;

    (async () => {
      try {
        const targetWallet: Wallet = getWallet(connectedWalletId);

        assert(targetWallet, `Wallet Id Not Found ${connectedWalletId}`);

        await targetWallet.waitUntilReady();
        
        // Check if this is a Ledger hardware wallet
        if (targetWallet instanceof LedgerWallet) {
          // For Ledger wallet, load accounts from LedgerProvider
          if (!ledgerContext) {
            console.error('LedgerProvider not available for Ledger wallet');
            removeConnectedWalletId();
            return;
          }

          // Use ledger accounts from the provider
          const ledgerAccounts = ledgerContext.ledgerAccounts;
          
          if (ledgerAccounts.length === 0) {
            // Don't disconnect immediately for Ledger, user might import accounts later
            setAccounts([]);
          } else {
            setAccounts(ledgerAccounts);
          }

          // Create LedgerConnect instance for signer
          const ledgerConnect = new LedgerConnect();
          setSigner(ledgerConnect.getSigner());

          // Only remove the connected account if we're switching to a different wallet
          if (!isFirstRender) {
            removeConnectedAccount();
          }
        } else {
          // For extension wallets, use the existing logic
          const injectedProvider = (targetWallet as ExtensionWallet).injectedProvider;

          assert(injectedProvider?.enable, `Invalid Wallet: ${targetWallet.id}`);

          const injected = await injectedProvider.enable(appName);
          const initialConnectedAccounts = await injected.accounts.get();

          // TODO keep track of wallet decision?
          if (initialConnectedAccounts.length === 0) {
            removeConnectedWalletId();
            return;
          }

          // reset accounts on wallet changing
          setAccounts([]);

          // only remove the connected account if we're switching to a different wallet
          if (!isFirstRender) {
            removeConnectedAccount();
          }

          // Convert InjectedAccount to TypinkAccount
          const convertToTypinkAccount = (injectedAccounts: InjectedAccount[]): TypinkAccount[] => {
            return injectedAccounts.map(account => ({
              address: account.address,
              walletId: targetWallet.id,
              source: 'extension' as const,
              name: account.name,
              genesisHash: account.genesisHash,
              type: account.type,
            }));
          };

          // Set initial accounts
          setAccounts(convertToTypinkAccount(initialConnectedAccounts));
          
          unsub = injected.accounts.subscribe((injectedAccounts: InjectedAccount[]) => {
            setAccounts(convertToTypinkAccount(injectedAccounts));
          });

          setSigner(injected.signer as any);
        }
      } catch (e) {
        console.error('Error while connecting wallet:', e);
        removeConnectedWalletId();
      }
    })();

    return () => unsub && unsub();
  }, [connectedWalletId, appName]);

  // Watch for Ledger account changes when Ledger wallet is connected
  useEffect(() => {
    if (!connectedWallet || !(connectedWallet instanceof LedgerWallet) || !ledgerContext) {
      return;
    }

    // Update accounts when ledger accounts change
    setAccounts(ledgerContext.ledgerAccounts);
  }, [ledgerContext?.ledgerAccounts, connectedWallet]);

  const connectWallet = async (walletId: string) => {
    setConnectedWalletId(walletId);
  };

  const disconnect = () => {
    removeConnectedWalletId();
    removeConnectedAccount();
    setSigner(undefined);
    setAccounts([]);
  };

  return (
    <WalletSetupContext.Provider
      value={{
        accounts,
        connectWallet,
        disconnect,
        connectedWalletId,
        connectedWallet,
        setConnectedAccount,
        wallets,
        appName
      }}>
      <WalletProvider signer={signer} connectedAccount={connectedAccount}>
        {children}
      </WalletProvider>
    </WalletSetupContext.Provider>
  );
}
