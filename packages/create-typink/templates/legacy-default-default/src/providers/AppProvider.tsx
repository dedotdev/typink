import { createContext, useContext } from 'react';
import { Props } from '@/types.ts';
import { Contract } from 'dedot/contracts';
import { useContract } from 'typink';
import { ContractId } from '@/contracts/deployments.ts';

import { GreeterContractApi } from '@/contracts/types/greeter';

interface AppContextProps {
  greeterContract?: Contract<GreeterContractApi>;
}

const AppContext = createContext<AppContextProps>(null as any);

export const useApp = () => {
  return useContext(AppContext);
};

export function AppProvider({ children }: Props) {
  const { contract: greeterContract } = useContract<GreeterContractApi>(ContractId.GREETER);

  return (
    <AppContext.Provider
      value={{
        greeterContract,
      }}>
      {children}
    </AppContext.Provider>
  );
}
