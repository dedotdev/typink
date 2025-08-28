'use client';

import { createContext, useContext } from 'react';
import { ContractId, deployments } from '@/contracts/deployments';
import { FlipperContractApi } from '@/contracts/types/flipper';
import { Props } from '@/lib/types';
import { Contract } from 'dedot/contracts';
import { useContract } from 'typink';
import { development, polkadotjs, popTestnet, subwallet, talisman, TypinkProvider } from 'typink';

const DEFAULT_CALLER = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY'; // Alice

// Supported networks configuration
const SUPPORTED_NETWORKS = [popTestnet];
// Uncomment the following lines to enable the development network: https://github.com/use-ink/ink-node
// if (process.env.NODE_ENV === "development") {
//   SUPPORTED_NETWORKS.push(development);
// }

// Supported wallets
const SUPPORTED_WALLETS = [subwallet, talisman, polkadotjs];

interface AppContextProps {
  flipperContract?: Contract<FlipperContractApi>;
}

const AppContext = createContext<AppContextProps>(null as any);

export const useApp = () => {
  return useContext(AppContext);
};

function AppContextProvider({ children }: Props) {
  const { contract: flipperContract } = useContract<FlipperContractApi>(ContractId.FLIPPER);

  return <AppContext.Provider value={{ flipperContract }}>{children}</AppContext.Provider>;
}

export function AppProvider({ children }: Props) {
  return (
    <TypinkProvider
      appName='Typink Template'
      deployments={deployments}
      defaultCaller={DEFAULT_CALLER}
      supportedNetworks={SUPPORTED_NETWORKS}
      defaultNetworkId={popTestnet.id}
      cacheMetadata={true}
      wallets={SUPPORTED_WALLETS}>
      <AppContextProvider>{children}</AppContextProvider>
    </TypinkProvider>
  );
}
