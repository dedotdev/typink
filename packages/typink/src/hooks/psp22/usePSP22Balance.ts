import { SubstrateAddress } from 'src/types';
import { useRawContract } from '../useRawContract.js';
import { Psp22ContractApi } from './contracts/psp22';
import { useContractQuery } from '../useContractQuery.js';
import { useTypink } from '../useTypink.js';
import { useWatchContractEvent } from '../useWatchContractEvent.js';
import { useCallback, useEffect, useState } from 'react';

export function usePSP22Balance(parameters: {
  contractAddress: SubstrateAddress;
  address?: SubstrateAddress;
  watch?: boolean;
}) {
  const { defaultCaller, connectedAccount } = useTypink();
  const [psp22Metadata, setPsp22Metadata] = useState<any>();
  const { contractAddress, address = connectedAccount?.address || defaultCaller, watch = false } = parameters;
  const { contract } = useRawContract<Psp22ContractApi>(psp22Metadata as any, contractAddress);

  useEffect(() => {
    let mounted = true;

    // @ts-ignore
    import('./contracts/psp22.json')
      .then((metadata) => {
        if (mounted) {
          setPsp22Metadata(metadata);
        }
      })
      .catch(console.error);

    return () => {
      mounted = false;
    };
  }, []);

  const result = useContractQuery({
    contract,
    fn: 'psp22BalanceOf',
    args: [address],
  });

  useWatchContractEvent(
    contract,
    'Transfer',
    useCallback(
      (events) => {
        if (!watch || events.length === 0) return;

        if (events.some(({ data }) => data.from?.eq(address) || data.to?.eq(address))) {
          result.refresh();
        }
      },
      [watch, address],
    ),
    watch,
  );

  return result;
}
