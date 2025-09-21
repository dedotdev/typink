'use client';

import PendingText from '@/components/shared/pending-text';
import { useCallback, useState } from 'react';
import { useContract, useContractQuery, useContractTx, useWatchContractEvent } from 'typink';
import { GreeterContractApi } from '@/contracts/types/greeter';
import { ContractId } from '@/contracts/deployments';
import { toast } from 'sonner';
import { shortenAddress } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2Icon, SparklesIcon } from 'lucide-react';
import { txToaster } from '@/components/tx-toaster';
import { BalanceInsufficientAlert } from '@/components/shared/balance-insufficient-alert';

export function GreeterBoard() {
  const { contract } = useContract<GreeterContractApi>(ContractId.GREETER);
  const setMessageTx = useContractTx(contract, 'setMessage');
  const [message, setMessage] = useState('');

  const { data: greet, isLoading } = useContractQuery({
    contract,
    fn: 'greet',
    watch: true,
  });

  const handleUpdateGreeting = async () => {
    if (!contract || !message) return;

    const toaster = txToaster('Signing transaction...');

    try {
      await setMessageTx.signAndSend({
        args: [message],
        callback: (result) => {
          const { status } = result;
          console.log(status);

          if (status.type === 'BestChainBlockIncluded') {
            setMessage('');
          }

          toaster.onTxProgress(result);
        },
      });
    } catch (e: any) {
      console.error(e, e.message);
      toaster.onTxError(e);
    }
  };

  // Listen to Greeted event from system events
  // & update the greeting message in real-time
  //
  // To verify this, try open 2 tabs of the app
  // & update the greeting message in one tab,
  // you will see the greeting message updated in the other tab
  useWatchContractEvent(
    contract,
    'Greeted',
    useCallback((events) => {
      events.forEach((greetedEvent) => {
        const {
          name,
          data: { from, message },
        } = greetedEvent;

        console.log(`Found a ${name} event sent from: ${from?.address()}, message: ${message}  `);

        toast.success(
          <div className='space-y-2'>
            <div className='flex items-center gap-2'>
              <SparklesIcon className='w-4 h-4 text-green-500' />
              <span className='font-semibold'>New {name} Event!</span>
            </div>
            <div className='space-y-1 text-sm text-muted-foreground'>
              <p>
                From: <span className='font-medium text-foreground'>{shortenAddress(from?.address())}</span>
              </p>
              <p>
                Message: <span className='font-medium text-foreground'>"{message}"</span>
              </p>
            </div>
          </div>,
        );
      });
    }, []),
  );

  return (
    <Card className='bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-800'>
      <CardHeader>
        <CardTitle className='text-lg font-medium'>Greeter Contract</CardTitle>
      </CardHeader>

      <CardContent className='space-y-4'>
        {/* Current Message Display */}
        <div className='space-y-2'>
          <div className='text-sm text-muted-foreground'>Message:</div>
          <PendingText isLoading={isLoading} className='text-2xl font-semibold text-pink-500'>
            {greet}
          </PendingText>
        </div>

        {/* Update Message Form */}
        <div className='space-y-3'>
          <Label htmlFor='greeting' className='text-sm text-muted-foreground'>
            Update message
          </Label>
          <Input
            id='greeting'
            type='text'
            maxLength={50}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={setMessageTx.inBestBlockProgress}
            placeholder='Hello world!'
            className='h-10'
          />
          <div className='text-xs text-muted-foreground'>Max {50 - message.length} characters</div>

          <Button
            type='button'
            size='default'
            disabled={!message.trim() || setMessageTx.inBestBlockProgress}
            onClick={handleUpdateGreeting}
            className='w-full'>
            {setMessageTx.inBestBlockProgress ? (
              <>
                <Loader2Icon className='animate-spin mr-2 h-4 w-4' />
                Updating...
              </>
            ) : (
              'Update message'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
