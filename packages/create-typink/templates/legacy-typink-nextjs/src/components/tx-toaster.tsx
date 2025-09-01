import React, { useMemo } from 'react';
import { toast } from 'sonner';
import { ISubmittableResult, TxStatus } from 'dedot/types';
import { useTypink } from 'typink';

export type TxToaster = {
  onTxProgress: (progress: ISubmittableResult) => void;
  onTxError: (e: Error) => void;
};

/**
 * Creates a toast notification for transaction progress and manages its updates (sonner).
 */
export function txToaster(initialMessage: string = 'Signing Transaction...'): TxToaster {
  // Create a persistent loading toast; we’ll update it by reusing the same id.
  const toastId = toast.loading(initialMessage, { duration: Infinity });

  const onTxProgress = (progress: ISubmittableResult) => {
    let terminal = false;
    let message: string = 'Transaction In Progress...';

    const { status, dispatchError } = progress;
    const succeeded = !dispatchError;

    if (status.type === 'Finalized') {
      terminal = true;
      message = succeeded ? 'Transaction Successful' : 'Transaction Failed';
    } else if (status.type === 'Invalid' || status.type === 'Drop') {
      terminal = true;
      message = 'Transaction Failed';
    }

    const body = <TxProgress message={message} status={status} />;

    if (terminal) {
      // Update the existing toast into a success/error and let it auto-dismiss.
      if (succeeded) {
        toast.success(body, { id: toastId, duration: 5000 });
      } else {
        toast.error(body, { id: toastId, duration: 5000 });
      }
    } else {
      // Still in-flight: keep it as loading and persist.
      toast.loading(body, { id: toastId, duration: Infinity });
    }
  };

  const onTxError = (e: Error) => {
    toast.error(<p>{e.message}</p>, { id: toastId, duration: 5000 });
  };

  return {
    onTxProgress,
    onTxError,
  };
}

const getBlockInfo = (status: TxStatus) => {
  if (status.type === 'BestChainBlockIncluded' || status.type === 'Finalized') {
    return `(#${status.value.blockNumber} / ${status.value.txIndex})`;
  }

  if ((status.type === 'Invalid' || status.type === 'Drop') && status.value.error) {
    return `(${status.value.error})`;
  }

  return '';
};

interface TxProgressProps {
  message: string;
  status: TxStatus;
}

function TxProgress({ message, status }: TxProgressProps) {
  const { network } = useTypink();

  const { label: viewOnExplorer, url: explorerUrl } = useMemo(() => {
    if (status.type === 'BestChainBlockIncluded' || status.type === 'Finalized') {
      const { subscanUrl, pjsUrl } = network;

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
  }, [status, network]);

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
