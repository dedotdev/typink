import { useRef } from 'react';

export function useIsFirstRender(): boolean {
  const renderRef = useRef(true);

  if (renderRef.current) {
    renderRef.current = false;
    return true;
  }

  return renderRef.current;
}
