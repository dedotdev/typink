import { useEffect, useState } from 'react';
import { useTypink } from './useTypink.js';
import { ContractDeployer, ExecutionOptions, GenericContractApi, ContractMetadata } from 'dedot/contracts';
import { Hash } from 'dedot/codecs';
import { useDeepDeps } from './internal/index.js';

export type UseDeployer<T extends GenericContractApi = GenericContractApi> = {
  deployer?: ContractDeployer<T>;
  // TODO add list of exposed constructors from the metadata
};

/**
 * A custom React hook for creating and managing a ContractDeployer.
 *
 * This hook initializes a ContractDeployer instance based on the provided metadata,
 * code hash or WASM, and options. It automatically updates when relevant context
 * (client, network, account) changes.
 *
 * @param {ContractMetadata | string} metadata - The contract metadata or its stringified version
 * @param {Hash | Uint8Array | string} codeHashOrWasm - The code hash or WASM of the contract
 * @param {ExecutionOptions} [options={}] - Additional execution options for the deployer
 * @returns {UseDeployer<T>} An object containing the deployer instance
 */
export function useDeployer<T extends GenericContractApi = GenericContractApi>(
  metadata: ContractMetadata | string,
  codeHashOrWasm: Hash | Uint8Array | string,
  options: ExecutionOptions = {},
): UseDeployer<T> {
  const { client, networkId, connectedAccount, defaultCaller } = useTypink();
  const [deployer, setDeployer] = useState<ContractDeployer<T>>();

  useEffect(
    () => {
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
    },
    useDeepDeps([client, networkId, connectedAccount?.address, defaultCaller, options]),
  );

  return {
    deployer,
  };
}
