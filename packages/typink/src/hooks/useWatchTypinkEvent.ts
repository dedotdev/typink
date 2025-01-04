import { useEffect } from 'react';
import { useDeepDeps } from './internal/index.js';
import { useTypink } from './useTypink.js';
import { TypinkEvent, TypinkEventsRegistration } from '../providers/index.js';

/**
 * A React hook that watches for internal typink events.
 *
 * This hook sets up a subscription to system events and filters for the specified event.
 * When new events are detected, it calls the provided callback function.
 *
 * @param event - The name of the event to watch for.
 * @param callback - Callback function to be called when new events are detected.
 * @param enabled - Optional boolean to enable or disable the event watching. Defaults to true.
 */
export function useWatchTypinkEvent<T extends TypinkEvent>(
  event: T,
  callback: TypinkEventsRegistration[T],
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
