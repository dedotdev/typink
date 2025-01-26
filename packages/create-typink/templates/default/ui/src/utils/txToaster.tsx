import { useMemo } from 'react';
import { toast, TypeOptions } from 'react-toastify';
import { ISubmittableResult, TxStatus } from 'dedot/types';
import { useTypink } from 'typink';

export type TxToaster = {
  onTxProgress: (result: ISubmittableResult) => void;
  onTxError: (e: Error) => void;
};

export function txToaster(initialMessage: string = 'Signing Transaction...'): TxToaster {
  const toastId = toast.info(initialMessage, {
    autoClose: false, // prettier-end-here
    isLoading: true,
    closeOnClick: false,
  });

  const onTxProgress = (result: ISubmittableResult) => {
    let toastType: TypeOptions = 'default';
    let autoClose: boolean | number = false;
    let toastMessage: string = 'Transaction In Progress...';

    const { status, dispatchError } = result;
    const succeeded = !dispatchError;

    if (status.type === 'Finalized') {
      autoClose = 5_000;
      toastType = succeeded ? 'success' : 'error';
      // TODO show dispatchError detailed error in failed case
      toastMessage = succeeded ? 'Transaction Successful' : 'Transaction Failed';
    } else if (status.type === 'Invalid' || status.type === 'Drop') {
      autoClose = 5_000;
      toastType = 'error';
      toastMessage = 'Transaction Failed';
    }

    toast.update(toastId, {
      render: <TxProgress message={toastMessage} status={status} />,
      type: toastType,
      isLoading: !autoClose,
      autoClose,
      closeOnClick: false,
    });
  };

  const onTxError = (e: Error) => {
    toast.update(toastId, {
      render: <p>{e.message}</p>,
      type: 'error',
      isLoading: false,
      autoClose: 5_000,
    });
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

    return { label: null, url: '' };
  }, [status]);

  return (
    <div>
      <p>{message}</p>
      <p style={{ fontSize: 12 }}>
        {status.type} {getBlockInfo(status)}
      </p>

      {viewOnExplorer && (
        <p style={{ fontSize: 12, marginTop: '0.5rem' }}>
          <a style={{ textDecoration: 'underline' }} href={explorerUrl} target='_blank'>
            👉 {viewOnExplorer}
          </a>
        </p>
      )}
    </div>
  );
}
