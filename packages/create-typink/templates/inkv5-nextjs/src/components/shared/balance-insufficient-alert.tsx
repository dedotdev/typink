'use client';

import { useBalance, useTypink } from 'typink';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, ExternalLink } from 'lucide-react';

const DEFAULT_FAUCET_URL = 'https://github.com/use-ink/contracts-ui/blob/master/FAUCETS.md';

export function BalanceInsufficientAlert() {
  const { network, connectedAccount } = useTypink();

  const balance = useBalance(connectedAccount?.address);

  if (balance === undefined || balance.free > 0n) return null;

  return (
    <Alert variant='warning' className='mb-4'>
      <AlertTriangle className='h-4 w-4' />
      <AlertTitle>Balance insufficient to make transactions</AlertTitle>
      <AlertDescription>
        <a
          href={network.faucetUrl || DEFAULT_FAUCET_URL}
          target='_blank'
          rel='noopener noreferrer'
          className='inline-flex items-center gap-1 text-primary hover:underline'>
          Claim some testnet token from faucet now!
          <ExternalLink className='h-3 w-3' />
        </a>
      </AlertDescription>
    </Alert>
  );
}
