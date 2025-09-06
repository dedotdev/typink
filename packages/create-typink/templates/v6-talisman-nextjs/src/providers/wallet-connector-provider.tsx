'use client'

import { createContext, useContext, useEffect, useState } from 'react';
import { useLocalStorage } from 'react-use';
import { getWalletBySource, Wallet } from '@talismn/connect-wallets';
import { TypinkAccount, Props } from 'typink';

interface WalletConnectorContextProps {
  wallet?: Wallet;
  connectWallet: (wallet: Wallet) => Promise<void>;
  connectedAccount?: TypinkAccount;
  setConnectedAccount: (account?: TypinkAccount) => void;
  accounts: TypinkAccount[];
  signOut: () => Promise<void>;
}

export const WalletConnectorContext = createContext<WalletConnectorContextProps>({} as any);

export const useWalletConnector = () => {
  return useContext(WalletConnectorContext);
};

interface WalletConnectorProviderProps extends Props { } // eslint-disable-line

const SELECTED_WALLET_KEY = '@talisman-connect/selected-wallet-name';

export const WalletConnectorProvider = ({ children }: WalletConnectorProviderProps) => {
  const [wallet, setWallet] = useState<Wallet>();
  const [connectedAccount, setConnectedAccount, removeConnectedAccount] =
    useLocalStorage<TypinkAccount>('CONNECTED_ACCOUNT');
  const [accounts, setAccounts] = useState<TypinkAccount[]>([]);

  useEffect(() => {
    const selectedItem = localStorage.getItem(SELECTED_WALLET_KEY);
    const wallet = getWalletBySource(selectedItem);
    if (!wallet) return;

    setWallet(wallet);
  }, []);

  useEffect(() => {
    (async () => {
      if (!wallet) {
        setAccounts([]);
        return;
      }

      await wallet.enable('---');
      wallet.subscribeAccounts((walletAccounts = []) => {
        setAccounts(walletAccounts.map(({ name, address, source }) => ({ name, address, source })));
      });
    })();
  }, [wallet]);

  const signOut = async () => {
    if (!wallet) return;

    setAccounts([]);
    setWallet(undefined);
    localStorage.removeItem(SELECTED_WALLET_KEY);
    removeConnectedAccount();
  };

  const connectWallet = async (wallet: Wallet) => {
    setWallet(wallet);
  };

  return (
    <WalletConnectorContext.Provider
      value={{
        wallet,
        accounts,
        connectWallet,
        connectedAccount,
        setConnectedAccount,
        signOut,
      }}>
      {children}
    </WalletConnectorContext.Provider>
  );
};
