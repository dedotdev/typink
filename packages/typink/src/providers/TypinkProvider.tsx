import { createContext } from 'react';
import { ClientContextProps, ClientProvider, ClientProviderProps, useClient } from './ClientProvider.js';
import { useWallet, WalletContextProps } from './WalletProvider.js';
import { ContractDeployment, SubstrateAddress } from '../types.js';
import {
  useWalletSetup,
  WalletSetupContextProps,
  WalletSetupProvider,
  WalletSetupProviderProps,
} from './WalletSetupProvider.js';

export interface TypinkContextProps extends ClientContextProps, WalletSetupContextProps, WalletContextProps {
  deployments: ContractDeployment[];
  // TODO validate substrate address
  defaultCaller: SubstrateAddress;

  // TODO list of networks to connect
  // TODO lazy options
}

export const TypinkContext = createContext<TypinkContextProps>({} as any);

export interface TypinkProviderProps extends ClientProviderProps, WalletSetupProviderProps {
  deployments: ContractDeployment[];
  defaultCaller: SubstrateAddress;
}

function TypinkProviderWrapper({ children, deployments, defaultCaller }: TypinkProviderProps) {
  const clientContext = useClient();
  const walletSetupContext = useWalletSetup();
  const walletContext = useWallet();

  return (
    <TypinkContext.Provider
      value={{ ...clientContext, ...walletSetupContext, ...walletContext, deployments, defaultCaller }}>
      {children}
    </TypinkContext.Provider>
  );
}

export function TypinkProvider({
  children,
  deployments,
  defaultCaller,
  defaultNetworkId,
  cacheMetadata = false,
  supportedNetworks,
  signer,
  connectedAccount,
}: TypinkProviderProps) {
  return (
    <WalletSetupProvider signer={signer} connectedAccount={connectedAccount}>
      <ClientProvider
        defaultNetworkId={defaultNetworkId}
        cacheMetadata={cacheMetadata}
        supportedNetworks={supportedNetworks}>
        <TypinkProviderWrapper deployments={deployments} defaultCaller={defaultCaller}>
          {children}
        </TypinkProviderWrapper>
      </ClientProvider>
    </WalletSetupProvider>
  );
}
