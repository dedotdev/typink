"use client";

import { createContext, useContext } from "react";
import { Props } from "@/lib/types";
import { Contract } from "dedot/contracts";
import { FlipperContractApi } from "@/contracts/types/flipper";
import { ContractId, deployments } from "@/contracts/deployments";
import {
  development,
  polkadotjs,
  popTestnet,
  subwallet,
  talisman,
  TypinkProvider,
  useContract,
} from "typink";

const DEFAULT_CALLER = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"; // Alice

// Supported networks configuration
const SUPPORTED_NETWORKS = [popTestnet ];
if (process.env.NODE_ENV === "development") {
  SUPPORTED_NETWORKS.push(development);
}

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
  const { contract: flipperContract } = useContract<FlipperContractApi>(
    ContractId.FLIPPER
  );

  return (
    <AppContext.Provider value={{ flipperContract }}>
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
    >
      <AppContextProvider>{children}</AppContextProvider>
    </TypinkProvider>
  );
}
