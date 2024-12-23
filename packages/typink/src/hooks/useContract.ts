import { useEffect, useState } from 'react';
import { useTypink } from './useTypink.js';
import { Contract, ExecutionOptions, GenericContractApi } from 'dedot/contracts';
import { TypinkError } from '../utils/index.js';
import { useDeepDeps } from './internal/index.js';

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
 * @param {ExecutionOptions} [options={}] - Optional execution options for the contract
 * @returns {UseContract<T>} An object containing the contract instance, if successfully initialized
 * @throws {TypinkError} If the contract deployment is not found on the specified network
 */
export function useContract<T extends GenericContractApi = GenericContractApi>(
  contractId: string,
  options: ExecutionOptions = {},
): UseContract<T> {
  const { deployments, client, networkId, connectedAccount, defaultCaller } = useTypink();
  const [contract, setContract] = useState<Contract<T>>();

  useEffect(
    () => {
      if (!client || !networkId) {
        setContract(undefined);
        return;
      }

      const deployment = deployments.find((d) => d.id === contractId && d.network === networkId);
      if (!deployment) {
        throw new TypinkError(`Contract deployment with id: ${contractId} not found on network: ${networkId}`);
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

      setContract(contract);
    },
    useDeepDeps([client, networkId, connectedAccount?.address, defaultCaller, options]),
  );

  return {
    contract,
  };
}
