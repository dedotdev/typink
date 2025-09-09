import React, { useMemo } from 'react';
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

export function TxProgress({ message, status, networkId }: TxProgressProps) {
  const { network, networks } = useTypink();
  
  // Use the specified network if networkId is provided, otherwise use current network
  const targetNetwork = networkId ? networks.find(n => n.id === networkId) || network : network;

  const { label: viewOnExplorer, url: explorerUrl } = useMemo(() => {
    if (status.type === 'BestChainBlockIncluded' || status.type === 'Finalized') {
      const { subscanUrl, pjsUrl } = targetNetwork;

      if (subscanUrl) {
        return {
          label: 'View transaction on Subscan',
          url: `${subscanUrl}/extrinsic/${status.value.blockNumber}-${status.value.txIndex}`,
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
    <div>
      <p>{message}</p>
      <p style={{ fontSize: 12 }}>
        {status.type} {getBlockInfo(status)}
      </p>

      {viewOnExplorer && (
        <p style={{ fontSize: 12, marginTop: '0.5rem' }}>
          <a style={{ textDecoration: 'underline' }} href={explorerUrl} target='_blank' rel='noreferrer'>
            👉 {viewOnExplorer}
          </a>
        </p>
      )}
    </div>
  );
}
