import { useState } from 'react';
import { InternalEvent } from 'src/utils/events';

export const useListenerCounter = (counterEvent: InternalEvent) => {
  const [counter, setCounter] = useState(0);

  const increaseIfMatch = (event: InternalEvent) => {
    if (event !== counterEvent) return;

    setCounter((counter) => counter + 1);
  };

  const decreaseIfMatch = (event: InternalEvent) => {
    if (event !== counterEvent) return;

    setCounter((counter) => counter - 1);
  };

  return { counter, increaseIfMatch, decreaseIfMatch, hasListener: counter > 0 };
};
