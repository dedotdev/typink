import { createContext, useContext } from 'react';
import { ContractId } from '@/contracts/deployments.ts';
import { FlipperContractApi } from '@/contracts/types/flipper';
import { Props } from '@/types.ts';
import { Contract } from 'dedot/contracts';
import { useContract } from 'typink';

interface AppContextProps {
  flipperContract?: Contract<FlipperContractApi>;
}

const AppContext = createContext<AppContextProps>(null as any);

export const useApp = () => {
  return useContext(AppContext);
};

export function AppProvider({ children }: Props) {
  const { contract: flipperContract } = useContract<FlipperContractApi>(ContractId.FLIPPER);

  return (
    <AppContext.Provider
      value={{
        flipperContract,
      }}>
      {children}
    </AppContext.Provider>
  );
}
