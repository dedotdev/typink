import { Button, ButtonProps } from '@chakra-ui/react';
import { ReactNode, useState } from 'react';
import { useTypink } from 'typink';
import { txToaster } from '@/utils/txToaster.tsx';

export interface MapAccountButtonProps {
  onSuccess?: () => void;
  size?: ButtonProps['size'];
  variant?: ButtonProps['variant'];
  children?: ReactNode;
  refresh?: () => Promise<void>;
}

export default function MapAccountButton({
  onSuccess,
  size = 'sm',
  variant = 'solid',
  children = 'Map Account',
}: MapAccountButtonProps) {
  const { client, connectedAccount } = useTypink();
  const [isLoading, setIsLoading] = useState(false);

  const handleMapAccount = async () => {
    const toaster = txToaster();
    try {
      setIsLoading(true);

      if (!client || !connectedAccount) {
        throw new Error('No connected account or client available');
      }

      const balance = await client.query.system.account(connectedAccount.address);

      if (balance.data.free <= 0n) {
        throw new Error('Insufficient balance to map account');
      }

      await client.tx.revive
        .mapAccount() // --
        .signAndSend(connectedAccount.address, (result) => {
          const { status } = result;
          console.log(status);
          toaster.onTxProgress(result);

          if (status.type === 'BestChainBlockIncluded' || status.type === 'Finalized') {
            onSuccess?.();
          }
        })
        .untilFinalized();
    } catch (error: any) {
      console.error('Error mapping account:', error);
      toaster.onTxError(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Don't show button if revive is not available
  // TODO add an util for this
  if (!client?.tx?.revive?.mapAccount) {
    return null;
  }

  return (
    <Button
      size={size}
      variant={variant}
      colorScheme='primary'
      isLoading={isLoading}
      isDisabled={!connectedAccount || isLoading}
      loadingText='Mapping...'
      onClick={handleMapAccount}>
      {children}
    </Button>
  );
}
