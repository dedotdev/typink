import { useMemo, useState } from 'react';
import { useTypink } from './useTypink.js';
import { Args, OmitNever, Pop, SubstrateAddress } from '../types.js';
import {
  ConstructorCallOptions,
  ConstructorTxOptions,
  ContractDeployer,
  ContractTxOptions,
  GenericContractApi,
} from 'dedot/contracts';
import { IEventRecord, IRuntimeEvent, ISubmittableResult } from 'dedot/types';
import { assert, deferred } from 'dedot/utils';
import { ContractMessageError, withReadableErrorMessage } from '../utils/index.js';
import { Hash } from 'dedot/codecs';
import { useDeepDeps } from './internal/index.js';
import { checkBalanceSufficiency } from '../helpers/index.js';

type UseDeployerTx<A extends GenericContractApi = GenericContractApi> = OmitNever<{
  [K in keyof A['constructorTx']]: K extends string ? (K extends `${infer Literal}` ? Literal : never) : never;
}>;

type UseDeployerTxReturnType<
  T extends GenericContractApi = GenericContractApi,
  M extends keyof UseDeployerTx<T> = keyof UseDeployerTx<T>,
> = {
  signAndSend(
    parameters: {
      txOptions?: Partial<ConstructorTxOptions>;
      callback?: (
        result: ISubmittableResult,
        // deployed contract address, TODO we should have a more straight forward way to access this
        contractAddress?: SubstrateAddress,
      ) => void;
      // TODO status callback, signer option
    } & Args<Pop<Parameters<T['constructorTx'][M]>>>,
  ): Promise<void>;
  inProgress: boolean;
  inBestBlockProgress: boolean;
};

/**
 * A hook for managing contract deployment transactions.
 *
 * This hook provides functionality to sign and send a contract deployment transaction,
 * and tracks the progress of the transaction. It's similar to the useContractTx hook
 * but specifically for contract deployment.
 *
 * @param {ContractDeployer<T> | undefined} deployer - The contract deployer instance
 * @param {M} fn - The key of the constructor function to be called
 *
 * @returns {UseDeployerTxReturnType<T, M>} An object containing:
 *   - signAndSend: A function to sign and send the deployment transaction
 *   - inProgress: A boolean indicating if a transaction is in progress. It's set to true when
 *     the transaction starts and turns back to false when the transaction status is finalized,
 *     invalid, or dropped.
 *   - inBestBlockProgress: A boolean indicating if the transaction is being processed but not
 *     yet included in the best block. It's set to true when the transaction starts and turns
 *     back to false when the transaction is included in the best block, which happens before
 *     finalization.
 */
export function useDeployerTx<
  T extends GenericContractApi = GenericContractApi,
  M extends keyof UseDeployerTx<T> = keyof UseDeployerTx<T>,
>(deployer: ContractDeployer<T> | undefined, fn: M): UseDeployerTxReturnType<T, M> {
  const [inProgress, setInProgress] = useState(false);
  const [inBestBlockProgress, setInBestBlockProgress] = useState(false);

  const { connectedAccount } = useTypink();

  const signAndSend = useMemo(
    () => {
      return async (o: Parameters<UseDeployerTxReturnType<T>['signAndSend']>[0]) => {
        assert(deployer, 'ContractDeployer not found');
        assert(connectedAccount, 'No connected account. Please connect your wallet.');

        setInProgress(true);
        setInBestBlockProgress(true);

        try {
          // @ts-ignore
          const { args = [], txOptions, callback: optionalCallback } = o;

          const extractContractAddress = (
            events: IEventRecord<IRuntimeEvent, Hash>[],
          ): SubstrateAddress | undefined => {
            if (!events || events.length === 0) return;

            const instantiatedEvent = deployer.client.events.contracts.Instantiated.find(events);
            assert(instantiatedEvent, 'Event Contracts.Instantiated should be available');

            return instantiatedEvent.palletEvent.data.contract.address();
          };

          const callback = (result: ISubmittableResult) => {
            const { status, events } = result;
            if (status.type === 'BestChainBlockIncluded') {
              setInBestBlockProgress(false);
            }

            const contractAddress = extractContractAddress(events);

            optionalCallback && optionalCallback(result, contractAddress);
          };

          // @ts-ignore
          await deployerTx({
            deployer,
            fn,
            args,
            caller: connectedAccount.address,
            txOptions,
            callback,
          });
        } finally {
          setInProgress(false);
          setInBestBlockProgress(false);
        }
      };
    },
    useDeepDeps([deployer, connectedAccount, fn]),
  );

  return {
    signAndSend,
    inProgress,
    inBestBlockProgress,
  };
}

export async function deployerTx<
  T extends GenericContractApi = GenericContractApi,
  M extends keyof UseDeployerTx<T> = keyof UseDeployerTx<T>,
>(
  parameters: {
    deployer: ContractDeployer<T>;
    caller: string; // | IKeyringPair
    fn: M;
    txOptions?: Partial<ConstructorTxOptions>; // TODO customize SignerOptions
    callback?: (result: ISubmittableResult) => void;
  } & Args<Pop<Parameters<T['tx'][M]>>>,
): Promise<void> {
  const defer = deferred<void>();

  const signAndSend = async () => {
    const { deployer, fn, args = [], caller, txOptions = {}, callback } = parameters;

    try {
      await checkBalanceSufficiency(deployer.client, caller);

      const dryRunOptions: ConstructorCallOptions = { caller };

      const dryRun = await deployer.query[fn](...args, dryRunOptions);
      console.log('Dry run result:', dryRun);

      const {
        data,
        raw: { gasRequired },
      } = dryRun;

      if (data && data['isErr'] && data['err']) {
        throw new ContractMessageError(data['err']);
      }

      const actualTxOptions: ContractTxOptions = {
        gasLimit: gasRequired,
        ...txOptions,
      };

      await deployer.tx[fn](...args, actualTxOptions).signAndSend(caller, (result) => {
        callback && callback(result);

        const {
          status: { type },
        } = result;

        if (type === 'Finalized' || type === 'Invalid' || type === 'Drop') {
          defer.resolve();
        }
      });
    } catch (e: any) {
      throw withReadableErrorMessage(deployer.client, e);
    }
  };

  signAndSend().catch(defer.reject);

  return defer.promise;
}
