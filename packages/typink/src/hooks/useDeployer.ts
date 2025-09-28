import { useEffect, useState } from 'react';
import { useTypink } from './useTypink.js';
import {
  AB,
  ContractDeployer,
  ExecutionOptions,
  GenericContractApi,
  LooseContractMetadata,
  LooseSolAbi,
} from 'dedot/contracts';
import { Hash } from 'dedot/codecs';
import { useDeepDeps } from './internal/index.js';
import { generateInstanceId } from '../utils/index.js';
import { NetworkOptions } from '../types.js';
import { usePolkadotClient } from './usePolkadotClient.js';

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
 * @param {LooseContractMetadata | LooseSolAbi | string} metadata - The contract metadata or its stringified version
 * @param {Hash | Uint8Array | string} codeHashOrWasm - The code hash or WASM of the contract
 * @param {ExecutionOptions} [options={}] - Additional execution options for the deployer
 * @returns {UseDeployer<T>} An object containing the deployer instance
 */
export function useDeployer<T extends GenericContractApi = GenericContractApi>(
  metadata: AB<T['metadataType'], LooseContractMetadata, LooseSolAbi> | string,
  codeHashOrWasm: Hash | Uint8Array | string,
  options: ExecutionOptions & NetworkOptions = {},
): UseDeployer<T> {
  const { connectedAccount, defaultCaller } = useTypink();
  const [deployer, setDeployer] = useState<ContractDeployer<T>>();
  const { client, network } = usePolkadotClient(options?.networkId);

  useEffect(
    () => {
      if (!client || !network) {
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

      Object.assign(deployer, { _instanceId: generateInstanceId() });

      setDeployer(deployer);
    },
    useDeepDeps([client, network?.id, connectedAccount?.address, defaultCaller, options]),
  );

  return {
    deployer,
  };
}
