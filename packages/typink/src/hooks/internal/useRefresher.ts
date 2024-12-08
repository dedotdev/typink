import { useState } from 'react';

/**
 * A custom React hook that provides a mechanism to trigger re-renders.
 * 
 * This hook manages a counter state and provides a function to increment it.
 * The counter can be used as a dependency in other hooks or components to
 * force re-evaluation or re-rendering.
 * 
 * @returns An object containing:
 *   - refresh: A function that increments the counter when called.
 *   - counter: The current value of the counter.
 */
export function useRefresher() {
  const [counter, setCounter] = useState(0);

  const refresh = () => {
    setCounter((counter) => counter + 1);
  };

  return { refresh, counter };
}
