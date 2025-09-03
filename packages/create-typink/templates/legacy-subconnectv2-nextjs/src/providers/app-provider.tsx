'use client';

import { useWalletConnector } from '@/providers/wallet-connector-provider';
import { createContext, useContext } from 'react';
import { Props } from '@/lib/types';
import { Contract } from 'dedot/contracts';
import { GreeterContractApi } from '@/contracts/types/greeter';
import { useContract } from 'typink';
import { ContractId, deployments } from '@/contracts/deployments';
import { TypinkProvider, {{ SUPPORTED_NETWORKS }} } from 'typink';

const DEFAULT_CALLER = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY'; // Alice

// Supported networks configuration
const SUPPORTED_NETWORKS = [ {{ SUPPORTED_NETWORKS }} ];
// Uncomment the following lines to enable the development network: https://github.com/paritytech/substrate-contracts-node
// if (process.env.NODE_ENV === "development") {
//   SUPPORTED_NETWORKS.push(development);
// }

interface AppContextProps {
  greeterContract?: Contract<GreeterContractApi>;
}

const AppContext = createContext<AppContextProps>(null as any);

export const useApp = () => {
  return useContext(AppContext);
};

function AppContextProvider({ children }: Props) {
  const { contract: greeterContract } = useContract<GreeterContractApi>(ContractId.GREETER);

  return <AppContext.Provider value={{ greeterContract }}>{children}</AppContext.Provider>;
}

export function AppProvider({ children }: Props) {
  const { wallet, connectedAccount } = useWalletConnector();

  return (
    <TypinkProvider
      appName='Typink Template'
      deployments={deployments}
      defaultCaller={DEFAULT_CALLER}
      supportedNetworks={SUPPORTED_NETWORKS}
      defaultNetworkId={ {{ DEFAULT_NETWORK_ID }} }
      signer={wallet?.signer}
      connectedAccount={connectedAccount} >
      <AppContextProvider>{children}</AppContextProvider>
    </TypinkProvider >
  );
}
