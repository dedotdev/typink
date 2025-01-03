import { useEffect } from 'react';
import { useDeepDeps } from './internal/index.js';
import { useTypink } from './useTypink.js';
import { InternalEvent } from 'src/utils/events.js';

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
export function useWatchInternalEvent(parameters: {
  event: InternalEvent;
  callback: (events: any[]) => void;
  enabled?: boolean;
}) {
  const { event, callback, enabled = true } = parameters;
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
