import { createContext, useContext, useEffect } from 'react';
import { Props } from '../types.js';
import { useClient } from './ClientProvider.js';
import { InternalEE, InternalEvent, Unsub } from '../utils/events.js';
import { useListenerCounter } from '../hooks/internal/useListenerCounter.js';

export interface ListenersContextProps {
  subscribeToEvent: (event: InternalEvent, callback: (events: any[]) => void) => Unsub | undefined;
}

export const ListenersContext = createContext<ListenersContextProps>({} as any);

export const useListeners = () => {
  return useContext(ListenersContext);
};

/**
 * ListenersProvider is a React component that manages event listeners for system events.
 * It provides a context for subscribing to and managing event listeners.
 *
 * @param props - The component props.
 * @param props.children - The child components to be wrapped by the provider.
 */
export function ListenersProvider({ children }: Props) {
  const { client } = useClient();
  const { hasListener, increaseIfMatch, decreaseIfMatch } = useListenerCounter(InternalEvent.SYSTEM_EVENTS);

  useEffect(() => {
    if (!client || !hasListener) return;

    let unsub: Unsub | undefined;

    (async () => {
      unsub = await client.query.system.events((events) => {
        InternalEE.emit(InternalEvent.SYSTEM_EVENTS, events);
      });
    })();

    return () => {
      unsub && unsub();
    };
  }, [client, hasListener]);

  const subscribeToEvent = (event: InternalEvent, callback: (events: any[]) => void): Unsub | undefined => {
    if (!client || !InternalEE) {
      return;
    }

    const unsub = InternalEE.on(event, callback);
    increaseIfMatch(event);

    return () => {
      unsub();
      decreaseIfMatch(event);
    };
  };

  return <ListenersContext.Provider value={{ subscribeToEvent }}>{children}</ListenersContext.Provider>;
}
