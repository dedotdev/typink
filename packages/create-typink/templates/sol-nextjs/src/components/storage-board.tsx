'use client';

import { PendingText } from '@/components/shared/pending-text';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ContractId } from '@/contracts/deployments';
import { StorageContractApi } from '@/contracts/types/storage';
import { shortenAddress } from '@/lib/utils';
import { DatabaseIcon } from 'lucide-react';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import {
  useContract,
  useContractQuery,
  useContractTx,
  useWatchContractEvent,
  useCheckMappedAccount,
  txToaster,
} from 'typink';

export function StorageBoard() {
  const { contract } = useContract<StorageContractApi>(ContractId.STORAGE);
  const storeTx = useContractTx(contract, 'store');
  const [inputValue, setInputValue] = useState('');
  const { isMapped } = useCheckMappedAccount();

  const { data: storedValue, isLoading } = useContractQuery({
    contract,
    fn: 'retrieve',
    watch: true,
  });

  const handleStore = async () => {
    if (!contract || !inputValue.trim()) return;

    const toaster = txToaster('Signing transaction...');

    try {
      const numValue = BigInt(inputValue);
      await storeTx.signAndSend({
        args: [numValue],
        callback: (result) => {
          const { status } = result;
          console.log(status);

          if (status.type === 'BestChainBlockIncluded') {
            setInputValue('');
          }

          toaster.onTxProgress(result);
        },
      });
    } catch (e: any) {
      console.error(e, e.message);
      toaster.onTxError(e);
    }
  };

  // Listen to Updated event from system events
  // & update the UI in real-time
  //
  // To verify this, try open 2 tabs of the app
  // & update the storage value in one tab,
  // you will see the value updated in the other tab
  useWatchContractEvent(
    contract,
    'Updated',
    useCallback((events) => {
      events.forEach((updatedEvent) => {
        const {
          name,
          data: { updater, newValue },
        } = updatedEvent;

        console.log(`Found an ${name} event sent from: ${updater}, new value: ${newValue}`);

        toast.success(
          <div className='space-y-2'>
            <div className='flex items-center gap-2'>
              <DatabaseIcon className='w-4 h-4 text-green-500' />
              <span className='font-semibold'>Storage {name}!</span>
            </div>
            <div className='space-y-1 text-sm text-muted-foreground'>
              <p>
                From: <span className='font-medium text-foreground'>{shortenAddress(updater)}</span>
              </p>
              <p>
                New Value: <span className='font-medium text-foreground'>{newValue.toString()}</span>
              </p>
            </div>
          </div>,
        );
      });
    }, []),
  );

  return (
    <Card className='bg-gray-200/70 dark:bg-white/5 border-none shadow-none gap-4'>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle className='text-2xl font-medium'>Storage Contract</CardTitle>
          <div className='text-sm text-muted-foreground bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full'>
            Solidity Contract on PVM
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className='space-y-4 bg-white/40 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden p-6'>
          {/* Current Stored Value Display */}
          <div className='space-y-2'>
            <div className='text-sm text-muted-foreground'>Stored Value:</div>
            <div className='bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-lg p-4 min-h-[60px] flex items-center justify-center'>
              <PendingText isLoading={isLoading} className='text-xl font-bold text-primary'>
                {storedValue}
              </PendingText>
            </div>
          </div>

          {/* Input and Store Form */}
          <div className='space-y-3'>
            <Label htmlFor='value-input' className='text-sm text-muted-foreground'>
              Enter a number to store:
            </Label>
            <Input
              id='value-input'
              type='number'
              placeholder='Enter a number...'
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={storeTx.inBestBlockProgress}
              className='h-10 bg-white placeholder:text-muted-foreground/50'
            />

            <Button
              size='lg'
              disabled={storeTx.inBestBlockProgress || !inputValue.trim()}
              onClick={handleStore}
              className='w-full bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 dark:from-gray-700 dark:to-gray-800 dark:hover:from-gray-600 dark:hover:to-gray-700 text-white'>
              {storeTx.inBestBlockProgress ? 'Updating...' : 'Update Value'}
            </Button>
          </div>
          {!isMapped && <p className='text-sm text-muted-foreground'>Connect and map your account to see the value!</p>}
        </div>
      </CardContent>
    </Card>
  );
}
