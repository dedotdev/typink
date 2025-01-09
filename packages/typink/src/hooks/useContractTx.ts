import { useMemo, useState } from 'react';
import { useTypink } from './useTypink.js';
import { Args, OmitNever, Pop } from '../types.js';
import { Contract, ContractCallOptions, ContractTxOptions, GenericContractApi } from 'dedot/contracts';
import { ISubmittableResult } from 'dedot/types';
import { assert, deferred } from 'dedot/utils';
import { ContractMessageError, withReadableErrorMessage } from '../utils/index.js';
import { useDeepDeps } from './internal/index.js';
import { checkBalanceSufficiency } from '../helpers/index.js';

type UseContractTx<A extends GenericContractApi = GenericContractApi> = OmitNever<{
  [K in keyof A['tx']]: K extends string ? (K extends `${infer Literal}` ? Literal : never) : never;
}>;

type UseContractTxReturnType<
  T extends GenericContractApi = GenericContractApi,
  M extends keyof UseContractTx<T> = keyof UseContractTx<T>,
> = {
  signAndSend(
    parameters: {
      txOptions?: Partial<ContractTxOptions>;
      callback?: (result: ISubmittableResult) => void;
      // TODO status callback, signer option
    } & Args<Pop<Parameters<T['tx'][M]>>>,
  ): Promise<void>;
  inProgress: boolean;
  inBestBlockProgress: boolean;
};

/**
 * A React hook for managing contract transactions.
 *
 * This hook provides functionality to sign and send transactions to a smart contract,
 * and tracks the progress of the transaction.
 *
 * @param {Contract<T> | undefined} contract - The contract instance to interact with
 * @param {M} fn - The name of the contract function to call
 *
 * @returns {UseContractTxReturnType<T, M>} An object containing:
 *   - signAndSend: A function to sign and send the transaction
 *   - inProgress: A boolean indicating if a transaction is in progress. It's set to true when
 *     the transaction starts and turns back to false when the transaction status is finalized,
 *     invalid, or dropped.
 *   - inBestBlockProgress: A boolean indicating if the transaction is being processed but not
 *     yet included in the best block. It's set to true when the transaction starts and turns
 *     back to false when the transaction is included in the best block, which happens before
 *     finalization.
 */
export function useContractTx<
  T extends GenericContractApi = GenericContractApi,
  M extends keyof UseContractTx<T> = keyof UseContractTx<T>,
>(contract: Contract<T> | undefined, fn: M): UseContractTxReturnType<T, M> {
  const [inProgress, setInProgress] = useState(false);
  const [inBestBlockProgress, setInBestBlockProgress] = useState(false);

  const { connectedAccount } = useTypink();

  const signAndSend = useMemo(
    () => {
      return async (o: Parameters<UseContractTxReturnType<T>['signAndSend']>[0]) => {
        assert(contract, 'Contract not found');
        assert(connectedAccount, 'No connected account. Please connect your wallet.');

        setInProgress(true);
        setInBestBlockProgress(true);

        try {
          // @ts-ignore
          const { args = [], txOptions, callback: optionalCallback } = o;

          const callback = (result: ISubmittableResult) => {
            const { status } = result;
            if (status.type === 'BestChainBlockIncluded') {
              setInBestBlockProgress(false);
            }

            optionalCallback && optionalCallback(result);
          };

          // @ts-ignore
          await contractTx({
            contract,
            fn,
            args,
            caller: connectedAccount.address,
            txOptions,
            callback,
          });
        } catch (e) {
          console.error(e);
          throw e;
        } finally {
          setInProgress(false);
          setInBestBlockProgress(false);
        }
      };
    },
    useDeepDeps([contract, connectedAccount]),
  );

  return {
    signAndSend,
    inProgress,
    inBestBlockProgress,
  };
}

export async function contractTx<
  T extends GenericContractApi = GenericContractApi,
  M extends keyof UseContractTx<T> = keyof UseContractTx<T>,
>(
  parameters: {
    contract: Contract<T>;
    caller: string; // | IKeyringPair
    fn: M;
    txOptions?: Partial<ContractTxOptions>; // TODO customize SignerOptions
    callback?: (result: ISubmittableResult) => void;
  } & Args<Pop<Parameters<T['tx'][M]>>>,
): Promise<void> {
  const defer = deferred<void>();

  const signAndSend = async () => {
    const { contract, fn, args = [], caller, txOptions = {}, callback } = parameters;

    await checkBalanceSufficiency(contract.client, caller);

    try {
      const dryRunOptions: ContractCallOptions = { caller };
      const dryRun = await contract.query[fn](...args, dryRunOptions);
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

      await contract.tx[fn](...args, actualTxOptions).signAndSend(caller, (result) => {
        callback && callback(result);

        const {
          status: { type },
        } = result;

        if (type === 'Finalized' || type === 'Invalid' || type === 'Drop') {
          defer.resolve();
        }
      });
    } catch (e: any) {
      throw withReadableErrorMessage(contract.client, e);
    }
  };

  signAndSend().catch(defer.reject);

  return defer.promise;
}
