import { useEffect, useState } from 'react';
import { useTypink } from './useTypink.js';
import { Contract, ExecutionOptions, GenericContractApi, LooseContractMetadata } from 'dedot/contracts';
import { useDeepDeps } from './internal/index.js';
import { generateInstanceId } from '../utils/index.js';

interface UseRawContract<T extends GenericContractApi = GenericContractApi> {
  contract: Contract<T> | undefined;
}

/**
 * A custom React hook for creating and managing a raw contract instance.
 *
 * This hook initializes a contract based on the provided metadata and address,
 * and updates it when relevant dependencies change.
 *
 * @param {string | LooseContractMetadata} [metadata] - The contract metadata or its string representation
 * @param {string} [address] - The address of the contract
 * @param {ExecutionOptions} [options={}] - Additional execution options for the contract
 * @returns {UseRawContract<T>} An object containing the contract instance or undefined
 */
export function useRawContract<T extends GenericContractApi = GenericContractApi>(
  metadata?: string | LooseContractMetadata,
  address?: string,
  options: ExecutionOptions = {},
): UseRawContract<T> {
  const { client, defaultCaller, connectedAccount } = useTypink();
  const [contract, setContract] = useState<Contract<T>>();

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
        metadata as any,
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
