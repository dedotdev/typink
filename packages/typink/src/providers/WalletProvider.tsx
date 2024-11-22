import { createContext, useContext } from 'react';
import { InjectedAccount, Props } from '../types.js';
import type { Signer as InjectedSigner } from '@polkadot/api/types';

export interface WalletContextProps {
  signer?: InjectedSigner;
  connectedAccount?: InjectedAccount;
}

export const WalletContext = createContext<WalletContextProps>({});

export const useWallet = () => {
  return useContext(WalletContext);
};

export interface WalletProviderProps extends Props {
  signer?: InjectedSigner;
  connectedAccount?: InjectedAccount;
}

export function WalletProvider({ children, signer, connectedAccount }: WalletProviderProps) {
  return (
    <WalletContext.Provider
      value={{
        signer,
        connectedAccount,
      }}>
      {children}
    </WalletContext.Provider>
  );
}
