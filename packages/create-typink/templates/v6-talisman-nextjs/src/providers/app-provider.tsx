"use client";

import { useWalletConnector } from '@/providers/wallet-connector-provider';
import { createContext, useContext } from "react";
import { Props } from "@/lib/types";
import { Contract } from "dedot/contracts";
import { FlipperContractApi } from "@/contracts/types/flipper";
import { useContract } from "typink";
import { ContractId, deployments } from "@/contracts/deployments";
import {
  development,
  popTestnet,
  TypinkProvider,
} from "typink";

const DEFAULT_CALLER = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"; // Alice

// Supported networks configuration
const SUPPORTED_NETWORKS = [popTestnet];
if (process.env.NODE_ENV === "development") {
  SUPPORTED_NETWORKS.push(development);
}

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
  const { wallet, connectedAccount } = useWalletConnector();

  return (
    <TypinkProvider
      appName="Typink Template"
      deployments={deployments}
      defaultCaller={DEFAULT_CALLER}
      supportedNetworks={SUPPORTED_NETWORKS}
      defaultNetworkId={popTestnet.id}
      signer={wallet?.signer}
      connectedAccount={connectedAccount}
    >
      <AppContextProvider>{children}</AppContextProvider>
    </TypinkProvider >
  );
}
