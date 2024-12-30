import { ISubstrateClient } from 'dedot';
import { FrameSystemEventRecord, SubstrateApi } from 'dedot/chaintypes';
import { useEffect } from 'react';
import { useListeners } from '../providers/index.js';
import { RpcVersion } from 'dedot/types';
import { useDeepDeps } from './internal/index.js';

export function useRegisterSystemEvents(parameters: {
  client: ISubstrateClient<SubstrateApi[RpcVersion]> | undefined;
  callback: (events: FrameSystemEventRecord[]) => void;
}) {
  const { client, callback } = parameters;
  const { subscribeSystemEvents } = useListeners();

  useEffect(() => {
    if (!client) return;

    const unsub = subscribeSystemEvents(callback);

    return () => {
      unsub && unsub();
    };
  }, useDeepDeps([client, callback]));
}
