'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpRight, Copy } from 'lucide-react';
import { useTypink, useBalances, formatBalance } from 'typink';
import { useEffect, useState, useMemo } from 'react';
import { toast } from 'sonner';
import { shortenAddress } from '@/lib/utils';

export function AccountInfo() {
  const { connectedAccount, network } = useTypink();

  const addresses = useMemo(() => (connectedAccount ? [connectedAccount.address] : []), [connectedAccount]);
  const balances = useBalances(addresses);

  const handleSelectAccount = () => {};

  const copyAddress = () => {
    if (connectedAccount) {
      navigator.clipboard.writeText(connectedAccount.address);
      toast.success('Address copied to clipboard');
    }
  };

  const balance = connectedAccount ? balances[connectedAccount.address] : null;
  const formattedBalance = balance ? formatBalance(balance.free, network) : '0';

  return (
    <Card className='bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-800'>
      <CardHeader className='pb-4'>
        <div className='flex items-center justify-between'>
          <CardTitle className='text-lg font-medium'>Account Info</CardTitle>
          <Button variant='outline' size='sm' onClick={handleSelectAccount}>
            Select Account
            <ArrowUpRight className='ml-1 h-3 w-3' />
          </Button>
        </div>
        <p className='text-sm text-muted-foreground'>
          {connectedAccount ? 'Account connected' : 'Select an account to use'}
        </p>
      </CardHeader>

      <CardContent className='space-y-4'>
        {connectedAccount ? (
          <>
            {/* Account Name */}
            <div className='space-y-3'>
              <div className='flex justify-between items-center py-2'>
                <span className='text-sm text-muted-foreground'>Name</span>
                <span className='text-sm font-medium'>{connectedAccount.name}</span>
              </div>

              {/* Account Address */}
              <div className='flex justify-between items-center py-2'>
                <span className='text-sm text-muted-foreground'>Address</span>
                <div className='flex items-center gap-2'>
                  <span className='text-sm font-mono'>{shortenAddress(connectedAccount.address)}</span>
                  <button
                    onClick={copyAddress}
                    className='p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors'>
                    <Copy className='h-3 w-3 text-muted-foreground' />
                  </button>
                </div>
              </div>

              {/* Balance */}
              <div className='flex justify-between items-center py-2'>
                <span className='text-sm text-muted-foreground'>Balance</span>
                <div className='flex items-center gap-1'>
                  <span className='text-sm font-mono'>{formattedBalance.split(' ')[0]}</span>
                  <span className='text-sm font-medium text-pink-500'>{network.symbol}</span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className='text-center py-8 text-sm text-muted-foreground'>No account connected</div>
        )}
      </CardContent>
    </Card>
  );
}
