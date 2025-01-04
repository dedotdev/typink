import { useState } from 'react';
import { TypinkEvent } from '../../providers/index.js';

export const useListenerCounter = (event: TypinkEvent) => {
  const [counter, setCounter] = useState(0);

  const tryIncrease = (eventToCheck: TypinkEvent) => {
    if (event !== eventToCheck) return;

    setCounter((counter) => counter + 1);
  };

  const tryDecrease = (eventToCheck: TypinkEvent) => {
    if (event !== eventToCheck) return;

    setCounter((counter) => counter - 1);
  };

  return {
    tryIncrease,
    tryDecrease,
    counter,
    hasAny: counter > 0,
  };
};
