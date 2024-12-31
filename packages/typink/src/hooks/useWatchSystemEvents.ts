import { ISubstrateClient } from 'dedot';
import { FrameSystemEventRecord, SubstrateApi } from 'dedot/chaintypes';
import { useEffect } from 'react';
import { RpcVersion } from 'dedot/types';
import { useDeepDeps } from './internal/index.js';
import { useTypink } from './useTypink.js';

/**
 * A React hook that watches for system events emitted by the chain.
 *
 * This hook sets up a subscription to system events and calls the provided callback function
 * when new events are detected.
 *
 * @param parameters - An object containing the hook parameters.
 * @param parameters.client - The Substrate client instance to watch system events for. Can be undefined.
 * @param parameters.callback - Callback function to be called when new events are detected.
 * @param parameters.watch - Optional boolean to enable or disable the event watching. Defaults to true.
 */
export function useWatchSystemEvents(parameters: {
  client: ISubstrateClient<SubstrateApi[RpcVersion]> | undefined;
  callback: (events: FrameSystemEventRecord[]) => void;
  watch: boolean;
}) {
  const { client, callback, watch = true } = parameters;
  const { subscribeSystemEvents } = useTypink();

  useEffect(
    () => {
      if (!client || !watch) return;

      let unmounted = false;

      const unsub = subscribeSystemEvents((events) => {
        if (unmounted) {
          unsub && unsub();
          return;
        }

        callback(events);
      });

      return () => {
        unsub && unsub();
        unmounted = true;
      };
    },
    useDeepDeps([client, callback, watch]),
  );
}
