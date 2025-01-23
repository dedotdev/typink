import { createContext, useContext } from 'react';
import { Props } from '@/types.ts';
import { Contract } from 'dedot/contracts';
import { GreeterContractApi } from 'contracts/types/greeter';
import { Psp22ContractApi } from 'contracts/types/psp22';
import { useContract } from 'typink';
import { ContractId } from 'contracts/deployments.ts';


interface AppContextProps {
  greeterContract?: Contract<GreeterContractApi>
  psp22Contract?: Contract<Psp22ContractApi>
}

const AppContext = createContext<AppContextProps>(null as any);

export const useApp = () => {
  return useContext(AppContext);
};

export function AppProvider({ children }: Props) {
  const { contract: greeterContract } = useContract<GreeterContractApi>(ContractId.GREETER)
  const { contract: psp22Contract } = useContract<Psp22ContractApi>(ContractId.PSP22)

  return (
    <AppContext.Provider value={{ greeterContract, psp22Contract }}>
      {children}
    </AppContext.Provider>
  );
}
