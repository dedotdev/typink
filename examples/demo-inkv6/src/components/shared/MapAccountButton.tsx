import { Button, ButtonProps } from '@chakra-ui/react';
import { ReactNode, useState } from 'react';
import { useTypink, checkBalanceSufficiency, txToaster } from 'typink';

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

      await checkBalanceSufficiency(client, connectedAccount.address);

      await client.tx.revive
        .mapAccount() // --
        .signAndSend(connectedAccount.address, (progress) => {
          const { status } = progress;
          console.log(status);
          toaster.onTxProgress(progress);

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
