import { useContext } from 'react';
import { TypinkContext, TypinkContextProps } from '../providers/index.js';
import { VersionedGenericSubstrateApi } from 'dedot/types';
import { SubstrateApi } from 'dedot/chaintypes';

export function useTypink<ChainApi extends VersionedGenericSubstrateApi = SubstrateApi>(): TypinkContextProps<ChainApi> {
  return useContext(TypinkContext) as TypinkContextProps<ChainApi>;
}