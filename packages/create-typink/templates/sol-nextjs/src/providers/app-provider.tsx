'use client';

import { createContext, useContext } from 'react';
import { ContractId, deployments } from '@/contracts/deployments';
import { StorageContractApi } from '@/contracts/types/storage';
import { Props } from '@/lib/types';
import { Contract } from 'dedot/contracts';
import {
  useContract,
  polkadotjs,
  subwallet,
  talisman,
  TypinkProvider,
  // -- START_SUPPORTED_NETWORKS --
  passetHub,
  // -- END_SUPPORTED_NETWORKS --
} from 'typink';

// Supported networks configuration
const SUPPORTED_NETWORKS = [
  // -- START_SUPPORTED_NETWORKS --
  passetHub,
  // -- END_SUPPORTED_NETWORKS --
];
// Uncomment the following lines to enable the development network: https://github.com/use-ink/ink-node
// if (process.env.NODE_ENV === "development") {
//   SUPPORTED_NETWORKS.push(development);
// }

// Supported wallets
const SUPPORTED_WALLETS = [subwallet, talisman, polkadotjs];

interface AppContextProps {
  storageContract?: Contract<StorageContractApi>;
}

const AppContext = createContext<AppContextProps>(null as any);

export const useApp = () => {
  return useContext(AppContext);
};

function AppContextProvider({ children }: Props) {
  const { contract: storageContract } = useContract<StorageContractApi>(ContractId.STORAGE);

  return <AppContext.Provider value={{ storageContract }}>{children}</AppContext.Provider>;
}

export function AppProvider({ children }: Props) {
  return (
    <TypinkProvider
      appName='Typink Template'
      deployments={deployments}
      supportedNetworks={SUPPORTED_NETWORKS}
      defaultNetworkId={
        // -- START_DEFAULT_NETWORK_ID --
        passetHub.id
        // -- END_DEFAULT_NETWORK_ID --
      }
      cacheMetadata={true}
      wallets={SUPPORTED_WALLETS}>
      <AppContextProvider>{children}</AppContextProvider>
    </TypinkProvider>
  );
}
