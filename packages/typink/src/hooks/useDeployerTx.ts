import { useMemo, useState } from 'react';
import { useTypink } from './useTypink.js';
import { Args, OmitNever, Pop, SubstrateAddress } from '../types.js';
import { ContractDeployer, ContractTxOptions, GenericContractApi, isContractDispatchError } from 'dedot/contracts';
import { IEventRecord, IRuntimeEvent, ISubmittableResult } from 'dedot/types';
import { assert, deferred } from 'dedot/utils';
import { TypinkError } from '../utils/index.js';
import { ConstructorCallOptions, ConstructorTxOptions } from '@dedot/contracts/types';
import { Hash } from '@dedot/codecs';

type UseDeployerTx<A extends GenericContractApi = GenericContractApi> = OmitNever<{
  [K in keyof A['constructorTx']]: K extends string ? (K extends `${infer Literal}` ? Literal : never) : never;
}>;

type UseDeployerTxReturnType<
  T extends GenericContractApi = GenericContractApi,
  M extends keyof UseDeployerTx<T> = keyof UseDeployerTx<T>,
> = {
  signAndSend(
    parameters: {
      txOptions?: ConstructorTxOptions;
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

export function useDeployerTx<
  T extends GenericContractApi = GenericContractApi,
  M extends keyof UseDeployerTx<T> = keyof UseDeployerTx<T>,
>(deployer: ContractDeployer<T> | undefined, fn: M): UseDeployerTxReturnType<T, M> {
  const [inProgress, setInProgress] = useState(false);
  const [inBestBlockProgress, setInBestBlockProgress] = useState(false);

  const { connectedAccount } = useTypink();

  const signAndSend = useMemo(() => {
    return async (o: Parameters<UseDeployerTxReturnType<T>['signAndSend']>[0]) => {
      assert(deployer, 'Contract Deployer Not Found');
      assert(connectedAccount, 'Connected Account Not Found');

      setInProgress(true);
      setInBestBlockProgress(true);

      try {
        // @ts-ignore
        const { args = [], txOptions, callback: optionalCallback } = o;

        const extractContractAddress = (events: IEventRecord<IRuntimeEvent, Hash>[]): SubstrateAddress | undefined => {
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
  }, [deployer, connectedAccount, fn]);

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
  // TODO assertions
  // TODO check if balance is sufficient

  const defer = deferred<void>();

  const signAndSend = async () => {
    const { deployer, fn, args = [], caller, txOptions = {}, callback } = parameters;

    try {
      // TODO dry running
      const dryRunOptions: ConstructorCallOptions = { caller };

      const dryRun = await deployer.query[fn](...args, dryRunOptions);
      console.log('Dry run result:', dryRun);

      const {
        data,
        raw: { gasRequired },
      } = dryRun;

      if (data && data['isErr'] && data['err']) {
        // TODO Add a specific contract level error
        throw new TypinkError(JSON.stringify(data['err']));
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
      if (isContractDispatchError(e) && e.dispatchError.type === 'Module') {
        const moduleError = deployer.client.registry.findErrorMeta(e.dispatchError);
        if (moduleError) {
          e.message = moduleError.docs.join('');
        }
      }

      throw e;
    }
  };

  signAndSend().catch(defer.reject);

  return defer.promise;
}