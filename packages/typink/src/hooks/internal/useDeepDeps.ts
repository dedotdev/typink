import { useRef } from 'react';
import deepEqual from 'fast-deep-equal/react.js';

/**
 * A custom React hook that performs a deep comparison of dependencies.
 * It returns a memoized version of the dependencies array that only changes when the deep equality check fails.
 * This is useful for optimizing re-renders in components that depend on complex objects or arrays.
 *
 * @param deps - An array of dependencies to be deeply compared.
 * @returns A memoized version of the dependencies array. This array reference remains stable
 *          across re-renders unless the deep equality check detects a change in the dependencies.
 */
export function useDeepDeps(deps: any[]): any[] {
  const depsRef = useRef<any[] | undefined>(undefined);

  if (!depsRef.current || !deepEqual(depsRef.current, deps)) {
    depsRef.current = deps;
  }

  return depsRef.current;
}
