"use client"

import { useCheckMappedAccount } from 'typink';
import { Button } from '@/components/ui/button';
import { ReactNode, useState } from 'react';
import { useTypink } from 'typink';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircleIcon } from 'lucide-react';
import { toast } from 'sonner';

export interface MapAccountButtonProps {
  onSuccess?: () => void;
  children?: ReactNode;
  refresh?: () => Promise<void>;
}

export function MapAccountButton({
  onSuccess
}: MapAccountButtonProps) {
  const { client, connectedAccount } = useTypink();
  const [isLoading, setIsLoading] = useState(false);

  const handleMapAccount = async () => {
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

          if (status.type === 'BestChainBlockIncluded' || status.type === 'Finalized') {
            toast.success("Map account successfully!!")
            onSuccess?.()
          } else {
            toast.info(`Transaction ${status.type}`, {
               description: "Processing blockchain transaction...",
            })
          }
        })
    } catch (error: any) {
      console.error('Error mapping account:', error);
        toast.error("Transaction failed", {
        description: error.message || "Please try again",
      });
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
      size='sm'
      variant='default'
      disabled={!connectedAccount || isLoading}
      onClick={handleMapAccount}>
      Map Account
    </Button>
  );
}

export function NonMappedAccountAlert() {
  const { isMapped, isLoading, refresh } = useCheckMappedAccount();

  if (isLoading || isMapped !== false) return null;

  const handleMappingSuccess = async () => {
    await refresh();
  };

  return (
    <Alert variant="default" className='container mx-auto max-w-2xl'>
        <AlertCircleIcon />
        <AlertTitle>Account Not Mapped</AlertTitle>
        <AlertDescription>
            Your account needs to be mapped before interacting with ink! v6 contracts on this network.
            <div className='py-2'>
            <MapAccountButton onSuccess={handleMappingSuccess} />
            </div>
        </AlertDescription>
    </Alert>
  );
}
