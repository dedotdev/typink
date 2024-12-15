import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useLocalStorage } from 'react-use';
import { useIsFirstRender, useWallets } from '../hooks/index.js';
import { InjectedAccount, InjectedSigner } from '../types.js';
import { Wallet } from '../wallets/index.js';
import { assert } from 'dedot/utils';
import { noop } from '../utils/index.js';
import { WalletProvider, WalletProviderProps } from './WalletProvider.js';

// Split these into 2 separate context (one for setup & one for signer & connected account)
export interface WalletSetupContextProps {
  // for setting up wallets
  connectWallet: (id: string) => void;
  disconnect: () => void;
  connectedWalletId?: string;
  connectedWallet?: Wallet;

  setConnectedAccount: (account: InjectedAccount) => void;
  accounts: InjectedAccount[];
}

export const WalletSetupContext = createContext<WalletSetupContextProps>({
  accounts: [],
  connectWallet: noop,
  disconnect: noop,
  setConnectedAccount: noop,
});

export const useWalletSetup = () => {
  return useContext(WalletSetupContext);
};

export interface WalletSetupProviderProps extends WalletProviderProps {}

/**
 * WalletSetupProvider is a component that manages wallet setup and connection state.
 * It provides context for wallet-related operations and wraps its children with necessary providers.
 *
 * @param props - The properties for the WalletSetupProvider component.
 * @param props.children - The child components to be wrapped by this provider.
 * @param props.signer - The initial signer object for the wallet.
 * @param props.connectedAccount - The initial connected account information.
 */
export function WalletSetupProvider({
  children,
  signer: initialSigner,
  connectedAccount: initialConnectedAccount,
}: WalletSetupProviderProps) {
  const { wallets } = useWallets();
  const [accounts, setAccounts] = useState<InjectedAccount[]>([]);

  const [connectedWalletId, setConnectedWalletId, removeConnectedWalletId] =
    useLocalStorage<string>('TYPINK::CONNECTED_WALLET');

  const [signer, setSigner] = useState<InjectedSigner>();
  const [connectedAccount, setConnectedAccount, removeConnectedAccount] =
    useLocalStorage<InjectedAccount>('TYPINK::CONNECTED_ACCOUNT');

  const getWallet = (id?: string): Wallet => wallets.find((one) => one.id === id)!;

  const connectedWallet = useMemo(() => getWallet(connectedWalletId), [connectedWalletId]);

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

  useEffect(() => {
    if (!connectedWalletId) return;

    let unsub: () => void;

    (async () => {
      const targetWallet: Wallet = getWallet(connectedWalletId);

      assert(targetWallet, `Wallet Id Not Found ${connectedWalletId}`);

      await targetWallet.waitUntilReady();
      const injectedProvider = targetWallet.injectedProvider;

      assert(injectedProvider?.enable, `Invalid Wallet: ${targetWallet.id}`);

      const injected = await injectedProvider.enable('Sample Dapp');

      // reset accounts on wallet changing
      setAccounts([]);

      // only remove the connected account if we're switching to a different wallet
      if (!isFirstRender) {
        removeConnectedAccount();
      }

      unsub = injected.accounts.subscribe(setAccounts);

      setSigner(injected.signer as any);
    })();

    return () => unsub && unsub();
  }, [connectedWalletId]);

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
      }}>
      <WalletProvider signer={signer} connectedAccount={connectedAccount}>
        {children}
      </WalletProvider>
    </WalletSetupContext.Provider>
  );
}
