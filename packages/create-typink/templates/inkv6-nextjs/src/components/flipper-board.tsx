'use client';

import { PendingText } from '@/components/shared/pending-text';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ContractId } from '@/contracts/deployments';
import { FlipperContractApi } from '@/contracts/types/flipper';
import { shortenAddress } from '@/lib/utils';
import { ToggleLeftIcon } from 'lucide-react';
import { useCallback } from 'react';
import { toast } from 'sonner';
import {
  txToaster,
  useCheckMappedAccount,
  useContract,
  useContractQuery,
  useContractTx,
  useWatchContractEvent,
} from 'typink';

export function FlipperBoard() {
  const { isMapped } = useCheckMappedAccount();
  const { contract } = useContract<FlipperContractApi>(ContractId.FLIPPER);
  const flipTx = useContractTx(contract, 'flip');

  const { data: value, isLoading } = useContractQuery({
    contract,
    fn: 'get',
    watch: true,
  });

  const handleFlip = async () => {
    if (!contract) return;

    const toaster = txToaster('Signing transaction...');

    try {
      await flipTx.signAndSend({
        callback: (result) => {
          console.log(result.status);

          toaster.onTxProgress(result);
        },
      });
    } catch (e: any) {
      console.error(e, e.message);
      toaster.onTxError(e);
    }
  };

  // Listen to Flipped event from system events
  // & update the UI in real-time
  //
  // To verify this, try open 2 tabs of the app
  // & flip the value in one tab,
  // you will see the value updated in the other tab
  useWatchContractEvent(
    contract,
    'Flipped',
    useCallback((events) => {
      events.forEach((flippedEvent) => {
        const {
          name,
          data: { oldValue, newValue, caller },
        } = flippedEvent;

        console.log(`Found a ${name} event sent from: ${caller}, old: ${oldValue}, new: ${newValue}`);

        toast.success(
          <div className='space-y-2'>
            <div className='flex items-center gap-2'>
              <ToggleLeftIcon className='w-4 h-4 text-green-500' />
              <span className='font-semibold'>New {name} Event!</span>
            </div>
            <div className='space-y-1 text-sm text-muted-foreground'>
              <p>
                From: <span className='font-medium text-foreground'>{shortenAddress(caller)}</span>
              </p>
              <p>
                Value: <span className='font-medium text-foreground'>{oldValue ? 'TRUE' : 'FALSE'}</span> →{' '}
                <span className='font-medium text-foreground'>{newValue ? 'TRUE' : 'FALSE'}</span>
              </p>
            </div>
          </div>,
        );
      });
    }, []),
  );

  return (
    <Card className='bg-gray-200/70 dark:bg-white/5 border-none shadow-none gap-4'>
      <CardHeader className='pb-4'>
        <div className='flex items-center justify-between'>
          <div className='flex flex-col gap-1.5'>
            <CardTitle className='text-2xl font-medium'>Flipper Contract</CardTitle>
            <p className='text-sm text-muted-foreground'>Flip a boolean value</p>
          </div>
          {contract && (
            <div className='text-sm text-muted-foreground bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full'>
              {contract.metadata.source.language}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className='space-y-4 bg-white/40 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden p-6'>
          {/* Current Value Display */}
          <div className='space-y-2'>
            <div className='text-sm text-muted-foreground'>Current Value:</div>
            <div className='bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-lg p-4 min-h-[60px] flex items-center justify-center'>
              <PendingText isLoading={isLoading} className='text-xl font-bold text-primary'>
                {value === undefined ? '' : value ? 'TRUE' : 'FALSE'}
              </PendingText>
            </div>
          </div>

          {/* Flip Button */}
          <Button
            size='lg'
            disabled={flipTx.inBestBlockProgress}
            onClick={handleFlip}
            className='w-full bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 dark:from-gray-700 dark:to-gray-800 dark:hover:from-gray-600 dark:hover:to-gray-700 text-white'>
            {flipTx.inBestBlockProgress ? 'Flipping...' : 'Flip Value!'}
          </Button>
          {isMapped === false && (
            <p className='text-sm text-muted-foreground'>Connect and map your account to see the value!</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
