import { useEffect, useState } from 'react';
import { useTypink } from './useTypink.js';
import { Contract, ExecutionOptions, GenericContractApi } from 'dedot/contracts';
import { generateInstanceId, TypinkError } from '../utils/index.js';
import { useDeepDeps } from './internal/index.js';
import { NetworkOptions } from '../types.js';
import { usePolkadotClient } from './usePolkadotClient.js';

export type UseContract<T extends GenericContractApi = GenericContractApi> = {
  contract?: Contract<T>;
};

/**
 * A React hook for initializing and managing a Contract instance.
 *
 * This hook creates a contract instance based on the provided contract ID and network information.
 * It automatically updates the contract instance when relevant dependencies change.
 *
 * @template T - The type of the contract API, extending GenericContractApi
 * @param {string} contractId - The unique identifier of the contract deployment
 * @param {ExecutionOptions & NetworkOptions} [options={}] - Optional execution options and network selection for the contract
 * @returns {UseContract<T>} An object containing the contract instance, if successfully initialized
 * @throws {TypinkError} If the contract deployment is not found on the specified network
 */
export function useContract<T extends GenericContractApi = GenericContractApi>(
  contractId: string,
  options: ExecutionOptions & NetworkOptions = {},
): UseContract<T> {
  const { deployments, connectedAccount, defaultCaller } = useTypink();
  const [contract, setContract] = useState<Contract<T>>();
  const { client, network } = usePolkadotClient(options?.networkId);

  useEffect(
    () => {
      if (!client || !network) {
        setContract(undefined);
        return;
      }

      const deployment = deployments.find((d) => d.id === contractId && d.network === network.id);
      if (!deployment) {
        throw new TypinkError(`Contract deployment with id: ${contractId} not found on network: ${network.id}`);
      }

      const contract = new Contract<T>(
        client,
        deployment.metadata,
        deployment.address, // prettier-end-here
        {
          defaultCaller: connectedAccount?.address || defaultCaller,
          ...options,
        },
      );

      // Add unique instance ID to track contract instance changes
      Object.assign(contract, { _instanceId: generateInstanceId() });

      setContract(contract);
    },
    useDeepDeps([client, network?.id, connectedAccount?.address, defaultCaller, options]),
  );

  return {
    contract,
  };
}
