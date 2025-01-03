import { OmitNever } from '../types.js';
import { Contract, GenericContractApi } from 'dedot/contracts';
import { useWatchInternalEvent } from './useWatchInternalEvent.js';
import { InternalEvent } from '../utils/events.js';
import { useCallback } from 'react';
import { useDeepDeps } from './internal/useDeepDeps.js';
import type { FrameSystemEventRecord } from 'dedot/chaintypes/index.js';

export type UseContractEvent<A extends GenericContractApi = GenericContractApi> = OmitNever<{
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
  useWatchInternalEvent({
    event: InternalEvent.SYSTEM_EVENTS,
    callback: useCallback(
      (events: FrameSystemEventRecord[]) => {
        if (!contract || !enabled) return;

        const contractEvents = contract.events[event].filter(events);

        if (contractEvents.length <= 0) return;

        // @ts-ignore
        onNewEvent(contractEvents);
      },
      useDeepDeps([contract, event, onNewEvent]),
    ),
    enabled,
  });
}
