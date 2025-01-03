import { useEffect } from 'react';
import { useDeepDeps } from './internal/index.js';
import { useTypink } from './useTypink.js';
import { InternalCallback, InternalEvent } from '../utils/events.js';

/**
 * A React hook that watches for internal system events.
 *
 * This hook sets up a subscription to system events and filters for the specified event.
 * When new events are detected, it calls the provided callback function.
 *
 * @param parameters - The hook parameters.
 * @param parameters.event - The name of the event to watch for.
 * @param parameters.callback - Callback function to be called when new events are detected.
 * @param parameters.enabled - Optional boolean to enable or disable the event watching. Defaults to true.
 */
export function useWatchInternalEvent<T extends InternalEvent>(
  event: T,
  callback: InternalCallback[T],
  enabled: boolean = true,
) {
  const { subscribeToEvent, client } = useTypink();

  useEffect(
    () => {
      if (!client || !enabled) return;

      let unmounted = false;

      const unsub = subscribeToEvent(event, (events) => {
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
    useDeepDeps([client, callback, event, enabled]),
  );
}
