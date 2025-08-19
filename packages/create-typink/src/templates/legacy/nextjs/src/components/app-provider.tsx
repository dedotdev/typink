"use client";

import { createContext, useContext } from "react";
import { Props } from "@/lib/types";
import { Contract } from "dedot/contracts";
import { GreeterContractApi } from "@/contracts/types/greeter";
import { Psp22ContractApi } from "@/contracts/types/psp22";
import { useContract } from "typink";
import { ContractId, deployments } from "@/contracts/deployments";
import {
  alephZeroTestnet,
  development,
  polkadotjs,
  popTestnet,
  subwallet,
  talisman,
  TypinkProvider,
} from "typink";

const DEFAULT_CALLER = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"; // Alice

// Supported networks configuration
const SUPPORTED_NETWORKS = [popTestnet, alephZeroTestnet];
if (process.env.NODE_ENV === "development") {
  SUPPORTED_NETWORKS.push(development);
}

// Supported wallets
const SUPPORTED_WALLETS = [subwallet, talisman, polkadotjs];

interface AppContextProps {
  greeterContract?: Contract<GreeterContractApi>;
  psp22Contract?: Contract<Psp22ContractApi>;
}

const AppContext = createContext<AppContextProps>(null as any);

export const useApp = () => {
  return useContext(AppContext);
};

function AppContextProvider({ children }: Props) {
  const { contract: greeterContract } = useContract<GreeterContractApi>(
    ContractId.GREETER
  );
  const { contract: psp22Contract } = useContract<Psp22ContractApi>(
    ContractId.PSP22
  );

  return (
    <AppContext.Provider value={{ greeterContract, psp22Contract }}>
      {children}
    </AppContext.Provider>
  );
}

export function AppProvider({ children }: Props) {
  return (
    <TypinkProvider
      appName="Typink Template"
      deployments={deployments}
      defaultCaller={DEFAULT_CALLER}
      supportedNetworks={SUPPORTED_NETWORKS}
      defaultNetworkId={popTestnet.id}
      cacheMetadata={true}
      wallets={SUPPORTED_WALLETS}
    >
      <AppContextProvider>{children}</AppContextProvider>
    </TypinkProvider>
  );
}
