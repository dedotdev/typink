import { createContext, useContext, useEffect } from 'react';
import { Props } from '../types.js';
import { useClient } from './ClientProvider.js';
import { useListenerCounter } from '../hooks/internal/useListenerCounter.js';
import { FrameSystemEventRecord } from 'dedot/chaintypes';
import { EventEmitter } from 'dedot/utils';
import { noop } from '../utils/index.js';

export type TypinkEventsRegistration = {
  [TypinkEvent.SYSTEM_EVENTS]: (events: FrameSystemEventRecord[]) => void;
};

export type Unsub = () => void;

export enum TypinkEvent {
  SYSTEM_EVENTS = 'SYSTEM_EVENTS',
}

const eventEmitter = new EventEmitter<TypinkEvent>();

export interface TypinkEventsContextProps {
  subscribeToEvent<T extends TypinkEvent>(event: T, callback: TypinkEventsRegistration[T]): Unsub;
}

export const TypinkEventsContext = createContext<TypinkEventsContextProps>({} as any);

export const useTypinkEvents = () => {
  return useContext(TypinkEventsContext);
};

/**
 * TypinkEventsProvider is a React component that manages event listeners for system events.
 * It provides a context for subscribing to and managing event listeners.
 *
 * @param props - The component props.
 * @param props.children - The child components to be wrapped by the provider.
 */
export function TypinkEventsProvider({ children }: Props) {
  const { client } = useClient();
  const { hasAny, tryIncrease, tryDecrease } = useListenerCounter(TypinkEvent.SYSTEM_EVENTS);

  useEffect(() => {
    if (!client || !hasAny) return;

    let unsub: Unsub | undefined;
    let unmounted = false;

    (async () => {
      unsub = await client.query.system.events((events) => {
        if (unmounted) {
          unsub && unsub();
          return;
        }

        eventEmitter.emit(TypinkEvent.SYSTEM_EVENTS, events);
      });
    })();

    return () => {
      unsub && unsub();
      unmounted = true;
    };
  }, [client, hasAny]);

  const subscribeToEvent = (event: TypinkEvent, callback: (events: any[]) => void): Unsub => {
    if (!client) return noop;

    const unsub = eventEmitter.on(event, callback);
    tryIncrease(event);

    return () => {
      unsub();
      tryDecrease(event);
    };
  };

  return <TypinkEventsContext.Provider value={{ subscribeToEvent }}>{children}</TypinkEventsContext.Provider>;
}
