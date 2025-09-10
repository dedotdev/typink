import { init, useConnectWallet, Web3OnboardProvider } from '@subwallet-connect/react';
import { createContext, useContext } from 'react';
import { useLocalStorage } from 'react-use';
import type { WalletState } from '@subwallet-connect/core';
import polkadotJs from '@subwallet-connect/polkadot-js';
import subwalletPolkadot from '@subwallet-connect/subwallet-polkadot';
import talisman from '@subwallet-connect/talisman';
import { TypinkAccount, Props } from 'typink';

interface WalletConnectorContextProps {
  wallet: WalletState | null;
  connectedAccount?: TypinkAccount;
  setConnectedAccount: (account?: TypinkAccount) => void;
  connectWallet: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const WalletConnectorContext = createContext<WalletConnectorContextProps>({} as any);

export const useWalletConnector = () => {
  return useContext(WalletConnectorContext);
};

interface WalletConnectorProviderProps extends Props {}

export const WalletConnectorProvider = ({ children }: WalletConnectorProviderProps) => {
  return (
    <Web3OnboardProvider web3Onboard={onboardWallets}>
      <WalletConnectorSetup>{children}</WalletConnectorSetup>
    </Web3OnboardProvider>
  );
};

export const WalletConnectorSetup = ({ children }: WalletConnectorProviderProps) => {
  const [{ wallet }, connect, disconnect] = useConnectWallet();
  const [connectedAccount, setConnectedAccount, removeConnectedAccount] =
    useLocalStorage<TypinkAccount>('CONNECTED_ACCOUNT');

  const signOut = async () => {
    if (!wallet) return;

    await disconnect(wallet);
    removeConnectedAccount();
  };

  const connectWallet = async () => {
    await connect();
  };

  return (
    <WalletConnectorContext.Provider
      value={{
        wallet,
        connectWallet,
        connectedAccount,
        setConnectedAccount,
        signOut,
      }}>
      {children}
    </WalletConnectorContext.Provider>
  );
};

export const onboardWallets = init({
  theme: 'dark',
  appMetadata: {
    name: 'Typink Dapp',
    recommendedInjectedWallets: [
      {
        name: 'SubWallet',
        url: 'https://subwallet.app',
      },
    ],
  },
  wallets: [
    subwalletPolkadot(), // prettier-end-here
    talisman(),
    polkadotJs(),
  ],
  connect: {
    autoConnectLastWallet: true,
    autoConnectAllPreviousWallet: true,
  },
  accountCenter: {
    desktop: {
      enabled: false,
    },
    mobile: {
      enabled: false,
    },
  },
  chains: [],
  chainsPolkadot: [
    {
      id: '0x68d56f15f85d3136970ec16946040bc1752654e906147f7e43e9d539d7c3de2f',
      label: 'Polkadot Asset Hub',
      namespace: 'substrate',
      decimal: 10,
      token: 'DOT',
      blockExplorerUrl: 'assethub-polkadot.subscan.io',
    },
  ],
});
