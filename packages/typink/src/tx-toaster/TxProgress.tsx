import { useMemo } from 'react';
import { TxStatus } from 'dedot/types';
import { useTypink } from '../hooks/index.js';
import { TxProgressProps } from './types.js';

const getBlockInfo = (status: TxStatus) => {
  if (status.type === 'BestChainBlockIncluded' || status.type === 'Finalized') {
    return `(#${status.value.blockNumber} / ${status.value.txIndex})`;
  }

  if ((status.type === 'Invalid' || status.type === 'Drop') && status.value.error) {
    return `(${status.value.error})`;
  }

  return '';
};

export function TxProgress({ message, networkId, progress }: TxProgressProps) {
  const { network, networks } = useTypink();
  const { status } = progress;

  // Use the specified network if networkId is provided, otherwise use current network
  const targetNetwork = networkId ? networks.find((n) => n.id === networkId) || network : network;

  const { label: viewOnExplorer, url: explorerUrl } = useMemo(() => {
    if (status.type === 'BestChainBlockIncluded' || status.type === 'Finalized') {
      const { subscanUrl, pjsUrl } = targetNetwork;

      if (subscanUrl) {
        return {
          label: 'View transaction on Subscan',
          url: `${subscanUrl}/extrinsic/${progress.txHash}`,
        };
      }

      if (pjsUrl) {
        return {
          label: 'View transaction on Polkadot.js',
          url: `${pjsUrl}#/explorer/query/${status.value.blockHash}`,
        };
      }
    }

    return { label: null as string | null, url: '' };
  }, [status, targetNetwork]);

  return (
    <div className='typink-tx-toaster'>
      <p className='typink-tx-toaster-message' style={{ fontSize: '1em', margin: 0 }}>
        {message}
      </p>
      <p
        className='typink-tx-toaster-status'
        style={{ fontSize: '0.85em', color: '#666', margin: 0, marginTop: '0.25rem' }}>
        {status.type} {getBlockInfo(status)}
      </p>

      {viewOnExplorer && (
        <p className='typink-tx-toaster-explorer' style={{ fontSize: '0.85em', margin: 0, marginTop: '0.5rem' }}>
          <a
            className='typink-tx-toaster-explorer-link'
            style={{ textDecoration: 'underline', color: '#666' }}
            href={explorerUrl}
            target='_blank'
            rel='noreferrer'>
            👉 {viewOnExplorer}
          </a>
        </p>
      )}
    </div>
  );
}
