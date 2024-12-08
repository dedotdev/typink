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

/**
 * Provides wallet-related information: signer for transactions and the currently connected account.
 *
 * @param props - The properties for the WalletProvider component.
 * @param props.children - The child components that will have access to the wallet context.
 * @param props.signer - Optional. The signer object for transaction signing.
 * @param props.connectedAccount - Optional. Information about the currently connected account.
 */
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
