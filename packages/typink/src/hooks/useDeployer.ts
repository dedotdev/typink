import { useEffect, useState } from 'react';
import { useTypink } from './useTypink.js';
import { ContractDeployer, ExecutionOptions, GenericContractApi } from 'dedot/contracts';
import { ContractMetadata } from '@dedot/contracts/types/index.js';
import { Hash } from '@dedot/codecs';
import { useDeepDeps } from './internal/index.js';

export type UseDeployer<T extends GenericContractApi = GenericContractApi> = {
  deployer?: ContractDeployer<T>;
  // TODO add list of exposed constructors from the metadata
};

export function useDeployer<T extends GenericContractApi = GenericContractApi>(
  metadata: ContractMetadata | string,
  codeHashOrWasm: Hash | Uint8Array | string,
  options: ExecutionOptions = {},
): UseDeployer<T> {
  const { client, networkId, connectedAccount, defaultCaller } = useTypink();
  const [deployer, setDeployer] = useState<ContractDeployer<T>>();

  const deps = useDeepDeps([client, networkId, connectedAccount?.address, defaultCaller, options]);

  useEffect(() => {
    if (!client || !networkId) {
      setDeployer(undefined);
      return;
    }

    const deployer = new ContractDeployer<T>(
      client,
      metadata,
      codeHashOrWasm, // prettier-end-here
      {
        defaultCaller: connectedAccount?.address || defaultCaller,
        ...options,
      },
    );

    setDeployer(deployer);

    return () => {
      setDeployer(undefined);
    };
  }, deps);

  return {
    deployer,
  };
}
