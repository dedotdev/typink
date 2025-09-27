'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Copy } from 'lucide-react';
import { formatBalance, useBalances, useTypink } from 'typink';
import { useMemo } from 'react';
import { toast } from 'sonner';
import { shortenAddress } from '@/lib/utils';
import { AccountAvatar } from '@/components/shared/account-avatar';

export function AccountInfo() {
  const { connectedAccount, network } = useTypink();

  const addresses = useMemo(() => (connectedAccount ? [connectedAccount.address] : []), [connectedAccount]);
  const balances = useBalances(addresses);

  const copyAddress = () => {
    if (connectedAccount) {
      navigator.clipboard.writeText(connectedAccount.address);
      toast.success('Address copied to clipboard');
    }
  };

  const balance = connectedAccount ? balances[connectedAccount.address] : null;
  const formattedBalance = balance ? formatBalance(balance.free, network) : '0';

  return (
    <Card className='bg-gray-200/70 dark:bg-white/5 border-none shadow-none gap-4'>
      <CardHeader className='pb-4'>
        <div className='flex items-center justify-between'>
          <CardTitle className='text-2xl font-medium'>Account Info</CardTitle>
        </div>
        <p className='text-sm text-muted-foreground'>
          {connectedAccount ? 'Account connected' : 'Connect to your wallet and select an account'}
        </p>
      </CardHeader>

      <CardContent>
        {connectedAccount ? (
          <div className='bg-white/40 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden'>
            {/* Account Name */}
            <div className='flex justify-between items-center px-6 py-3 border-b border-gray-200 dark:border-gray-800'>
              <span className='text-sm text-muted-foreground'>Name</span>
              <div className='text-sm font-medium flex items-center gap-2'>
                <AccountAvatar account={connectedAccount} size={20} className='mt-1' />
                {connectedAccount.name}
              </div>
            </div>

            {/* Account Address */}
            <div className='flex justify-between items-center px-6 py-3 border-b border-gray-200 dark:border-gray-800'>
              <span className='text-sm text-muted-foreground'>Address</span>
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
            <div className='flex justify-between items-center px-6 py-3'>
              <span className='text-sm text-muted-foreground'>Balance</span>
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
