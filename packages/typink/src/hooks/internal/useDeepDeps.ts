import { useRef } from 'react';
import deepEqual from 'fast-deep-equal/react.js';

export function useDeepDeps(deps: any[]): any[] {
  const depsRef = useRef<any[] | undefined>(undefined);

  if (!depsRef.current || !deepEqual(depsRef.current, deps)) {
    depsRef.current = deps;
  }

  return depsRef.current;
}
