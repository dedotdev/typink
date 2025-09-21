'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpRight, Copy, Send } from 'lucide-react';
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
    <Card className='bg-gray-200/70 dark:bg-gray-900/50 border-none shadow-none'>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle className='text-2xl font-medium'>Account Info</CardTitle>
          <Button variant='outline' size='sm' onClick={handleSelectAccount} className='w-[160px'>
            {connectedAccount ? (
              <>
                Switch Account
                <Send className='ml-1 h-2 w-2' />
              </>
            ) : (
              <>Connect Wallet</>
            )}
          </Button>
        </div>
        <p className='text-sm text-muted-foreground'>
          {connectedAccount ? 'Account connected' : 'Select an account to use'}
        </p>
      </CardHeader>

      <CardContent>
        {connectedAccount ? (
          <div className='bg-white/40 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden'>
            {/* Account Name */}
            <div className='flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-800'>
              <span className='text-sm font-semibold'>Name</span>
              <span className='text-sm font-medium'>{connectedAccount.name}</span>
            </div>

            {/* Account Address */}
            <div className='flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-800'>
              <span className='text-sm font-semibold'>Address</span>
              <div className='flex items-center gap-2'>
                <span className='text-sm font-mono'>{shortenAddress(connectedAccount.address)}</span>
                <button
                  onClick={copyAddress}
                  className='p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors cursor-pointer'>
                  <Copy className='h-3.5 w-3.5 text-muted-foreground hover:text-foreground' />
                </button>
              </div>
            </div>

            {/* Balance */}
            <div className='flex justify-between items-center px-6 py-4'>
              <span className='text-sm font-semibold'>Balance</span>
              <div className='flex items-center gap-2'>
                <span className='text-sm font-medium'>{formattedBalance.split(' ')[0]}</span>
                <span className='text-sm font-semibold text-green-600 dark:text-green-500'>{network.symbol}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className='bg-white/40 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg p-8'>
            <div className='text-center text-sm text-muted-foreground'>No account connected</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
