import { Button, ButtonProps } from '@chakra-ui/react';
import { ReactNode, useState } from 'react';
import { useTypink, checkBalanceSufficiency } from 'typink';
import { txToaster } from '@/utils/txToaster.tsx';
import { MerkleizedMetadata } from 'dedot/merkleized-metadata';
import { u8aToHex } from 'dedot/utils';

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
  const { client, connectedAccount, network } = useTypink();
  const [isLoading, setIsLoading] = useState(false);

  const handleMapAccount = async () => {
    const toaster = txToaster();
    try {
      setIsLoading(true);

      if (!client || !connectedAccount) {
        throw new Error('No connected account or client available');
      }

      await checkBalanceSufficiency(client, connectedAccount.address);

      const merkleizer = new MerkleizedMetadata(client.metadata, {
        decimals: network.decimals,
        tokenSymbol: network.symbol,
      });

      await client.tx.revive
        .mapAccount() // --
        .signAndSend(
          connectedAccount.address, // --
          { metadataHash: u8aToHex(merkleizer.digest()) },
          ({ status }) => {
            console.log(status);
            toaster.updateTxStatus(status);

            if (status.type === 'BestChainBlockIncluded' || status.type === 'Finalized') {
              onSuccess?.();
            }
          },
        )
        .untilFinalized();
    } catch (error: any) {
      console.error('Error mapping account:', error);
      toaster.onError(error);
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
