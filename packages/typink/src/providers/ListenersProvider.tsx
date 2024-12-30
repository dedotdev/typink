import { createContext, useContext, useEffect, useState } from 'react';
import { Props } from '../types.js';
import { useClient } from './ClientProvider.js';
import EE, { InternalEvent, SystemEventsListener, Unsub } from '../utils/events.js';

export interface ListenersContextProps {
  subscribeSystemEvents: (listener: SystemEventsListener) => Unsub | undefined;
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
  const [listenersCount, setListenersCount] = useState(0);

  // TODO! Find a better way to cancel client.query.system.events when not needed
  useEffect(() => {
    if (!client || !listenersCount) return;

    let unsub: Unsub | undefined;

    (async () => {
      unsub = await client.query.system.events((events) => {
        EE.emit(InternalEvent.SystemEvents, events);
      });
    })();

    return () => {
      unsub && unsub();
    };
  }, [client, listenersCount]);

  /**
   * Subscribes a new event listener to the system events.
   *
   * @param {EventListener} listener - The event listener function to be added.
   * @returns {Unsub | undefined} A function to unsubscribe the listener, or undefined if there's no client.
   */
  const subscribeSystemEvents = (listener: SystemEventsListener): Unsub | undefined => {
    if (!client || !EE) {
      return;
    }

    setListenersCount((count) => count + 1);

    const unsub = EE.on(InternalEvent.SystemEvents, listener);

    return () => {
      setListenersCount((count) => count - 1);
      unsub();
    };
  };

  return <ListenersContext.Provider value={{ subscribeSystemEvents }}>{children}</ListenersContext.Provider>;
}
