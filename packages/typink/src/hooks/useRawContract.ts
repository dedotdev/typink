import { useEffect, useState } from 'react';
import { useTypink } from './useTypink.js';
import { Contract, ContractMetadata, ExecutionOptions, GenericContractApi } from 'dedot/contracts';
import { useDeepDeps } from './internal/useDeepDeps';

export function useRawContract<T extends GenericContractApi = GenericContractApi>(
  metadata?: string | ContractMetadata,
  address?: string,
  options: ExecutionOptions = {},
) {
  const { client, defaultCaller, connectedAccount } = useTypink();
  const [contract, setContract] = useState<Contract<T>>();

  const deps = useDeepDeps([client, metadata, address, connectedAccount?.address, defaultCaller, options]);

  useEffect(() => {
    if (!client || !metadata || !address) {
      if (contract) {
        setContract(undefined);
      }

      return;
    }

    setContract(
      new Contract<T>(
        client,
        metadata as any,
        address, // prettier-end-here
        {
          defaultCaller: connectedAccount?.address || defaultCaller,
          ...options,
        },
      ),
    );
  }, deps);

  return {
    contract,
  };
}
