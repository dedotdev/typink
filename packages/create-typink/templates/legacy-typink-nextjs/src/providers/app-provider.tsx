'use client';

import { createContext, useContext } from 'react';
import { ContractId, deployments } from '@/contracts/deployments';
import { GreeterContractApi } from '@/contracts/types/greeter';
import { Props } from '@/lib/types';
import { Contract } from 'dedot/contracts';
import {
  useContract,
  polkadotjs,
  subwallet,
  talisman,
  TypinkProvider,
  // -- START_SUPPORTED_NETWORKS --
  alephZeroTestnet,
  // -- END_SUPPORTED_NETWORKS --
} from 'typink';

// Supported networks configuration
const SUPPORTED_NETWORKS = [
  // -- START_SUPPORTED_NETWORKS --
  alephZeroTestnet,
  // -- END_SUPPORTED_NETWORKS --
];
// Uncomment the following lines to enable the development network: https://github.com/paritytech/substrate-contracts-node
// if (process.env.NODE_ENV === "development") {
//   SUPPORTED_NETWORKS.push(development);
// }

// Supported wallets
const SUPPORTED_WALLETS = [subwallet, talisman, polkadotjs];

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
  return (
    <TypinkProvider
      appName='Typink Template'
      deployments={deployments}
      supportedNetworks={SUPPORTED_NETWORKS}
      defaultNetworkId={
        // -- START_DEFAULT_NETWORK_ID --
        alephZeroTestnet.id
        // -- END_DEFAULT_NETWORK_ID --
      }
      cacheMetadata={true}
      wallets={SUPPORTED_WALLETS}>
      <AppContextProvider>{children}</AppContextProvider>
    </TypinkProvider>
  );
}
