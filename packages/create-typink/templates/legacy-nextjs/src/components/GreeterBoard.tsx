'use client';

import PendingText from '@/components/pending-text';
import { useCallback, useEffect, useState } from 'react';
import { useContract, useContractQuery, useContractTx, useTypink, useWatchContractEvent } from 'typink';
import { GreeterContractApi } from '@/contracts/types/greeter';
import { ContractId } from '@/contracts/deployments';
import { toast } from 'sonner';
import { shortenAddress } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2Icon, SparklesIcon } from 'lucide-react';
import { txToaster } from '@/components/tx-toaster';
import { BalanceInsufficientAlert } from '@/components/dialog/balance-insufficient-alert';
import { AccountAvatar } from '@/components/account-avatar';

export function GreeterBoard() {
  const { contract } = useContract<GreeterContractApi>(ContractId.GREETER);
  const setMessageTx = useContractTx(contract, 'setMessage');
  const [message, setMessage] = useState('');
  const [mounted, setMounted] = useState(false);

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

  useEffect(() => {
    setMounted(true);
  }, []);

  const { connectedAccount } = useTypink();

  if (!mounted) return null;

  return (
    <div className='space-y-6'>
      {connectedAccount && <AccountAvatar account={connectedAccount} size={32} />}

      <BalanceInsufficientAlert />

      <Card className='shadow-lg'>
        <CardHeader>
          <CardTitle>Greeter Contract</CardTitle>
          <CardDescription>Interact with the Greeter smart contract on Polkadot</CardDescription>
        </CardHeader>

        <CardContent className='space-y-8'>
          <div className='bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-lg p-6 min-h-[80px] flex items-center justify-center'>
            <PendingText isLoading={isLoading} className='text-xl font-medium text-center'>
              {greet}
            </PendingText>
          </div>

          <div className='border-t pt-8'>
            <form className='space-y-6'>
              <div className='space-y-3'>
                <Label htmlFor='greeting' className='text-base font-medium'>
                  Update greeting message
                </Label>
                <Input
                  id='greeting'
                  type='text'
                  maxLength={50}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={setMessageTx.inBestBlockProgress}
                  placeholder='Enter your greeting message...'
                  className='h-12'
                />
                <div className='text-xs text-muted-foreground text-right'>{message.length}/50 characters</div>
              </div>

              <Button
                type='button'
                size='lg'
                disabled={!message.trim() || setMessageTx.inBestBlockProgress}
                onClick={handleUpdateGreeting}
                className='w-full bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 dark:from-gray-700 dark:to-gray-800 dark:hover:from-gray-600 dark:hover:to-gray-700 text-white'>
                {setMessageTx.inBestBlockProgress ? (
                  <>
                    <Loader2Icon className='animate-spin mr-2' />
                    Updating...
                  </>
                ) : (
                  'Update Greeting'
                )}
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
