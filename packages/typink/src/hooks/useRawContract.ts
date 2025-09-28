import { useEffect, useState } from 'react';
import { useTypink } from './useTypink.js';
import { AB, Contract, ExecutionOptions, GenericContractApi, LooseContractMetadata, LooseSolAbi } from 'dedot/contracts';
import { useDeepDeps } from './internal/index.js';
import { generateInstanceId } from '../utils/index.js';
import { NetworkOptions } from '../types.js';
import { usePolkadotClient } from './usePolkadotClient.js';

interface UseRawContract<T extends GenericContractApi = GenericContractApi> {
  contract: Contract<T> | undefined;
}

/**
 * A custom React hook for creating and managing a raw contract instance.
 *
 * This hook initializes a contract based on the provided metadata and address,
 * and updates it when relevant dependencies change.
 *
 * @param {string | LooseContractMetadata | LooseSolAbi} [metadata] - The contract metadata or its string representation
 * @param {string} [address] - The address of the contract
 * @param {ExecutionOptions & NetworkOptions} [options={}] - Additional execution options for the contract
 * @returns {UseRawContract<T>} An object containing the contract instance or undefined
 */
export function useRawContract<T extends GenericContractApi = GenericContractApi>(
  metadata?: string | AB<T['metadataType'], LooseContractMetadata, LooseSolAbi>,
  address?: string,
  options: ExecutionOptions & NetworkOptions = {},
): UseRawContract<T> {
  const { defaultCaller, connectedAccount } = useTypink();
  const [contract, setContract] = useState<Contract<T>>();
  const { client } = usePolkadotClient(options?.networkId);

  useEffect(
    () => {
      if (!client || !metadata || !address) {
        if (contract) {
          setContract(undefined);
        }

        return;
      }

      const newContract = new Contract<T>(
        client,
        metadata,
        address, // prettier-end-here
        {
          defaultCaller: connectedAccount?.address || defaultCaller,
          ...options,
        },
      );

      Object.assign(newContract, { _instanceId: generateInstanceId() });

      setContract(newContract);
    },
    useDeepDeps([client, metadata, address, connectedAccount?.address, defaultCaller, options]),
  );

  return {
    contract,
  };
}
