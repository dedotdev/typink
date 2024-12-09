import { useEffect } from 'react';
import { useTypink } from './useTypink.js';
import { OmitNever } from '../types.js';
import { Contract, GenericContractApi } from 'dedot/contracts';
import { Unsub } from 'dedot/types';
import { useDeepDeps } from './internal/index.js';

type UseContractEvent<A extends GenericContractApi = GenericContractApi> = OmitNever<{
  [K in keyof A['events']]: K extends string ? (K extends `${infer Literal}` ? Literal : never) : never;
}>;

/**
 * A React hook that watches for specific events emitted by a smart contract.
 *
 * This hook sets up a subscription to system events and filters for the specified contract event.
 * When new events are detected, it calls the provided callback function.
 *
 * @param contract - The contract instance to watch events for. Can be undefined.
 * @param event - The name of the event to watch for.
 * @param onNewEvent - Callback function to be called when new events are detected.
 *                     It's recommended to wrap this in useCallback to prevent unnecessary re-renders.
 * @param enabled - Optional boolean to enable or disable the event watching. Defaults to true.
 */
export function useWatchContractEvent<
  T extends GenericContractApi = GenericContractApi,
  M extends keyof UseContractEvent<T> = keyof UseContractEvent<T>,
>(
  contract: Contract<T> | undefined,
  event: M,
  onNewEvent: (events: ReturnType<T['events'][M]['filter']>) => void,
  enabled: boolean = true,
): void {
  const { client } = useTypink();

  useEffect(
    () => {
      if (!client || !contract || !enabled) return;

      // handle unsubscribing when component unmounts
      let done = false;
      let unsub: Unsub | undefined;

      (async () => {
        // TODO reuse this subscription more efficiently
        unsub = await client.query.system.events((events) => {
          if (done) {
            unsub && unsub();
            return;
          }

          const contractEvents = contract.events[event].filter(events);
          if (contractEvents.length === 0) return;

          // @ts-ignore
          onNewEvent(contractEvents);
        });
      })();

      return () => {
        unsub && unsub();
        done = true;
      };
    },
    useDeepDeps([client, contract, onNewEvent, enabled]),
  );
}
