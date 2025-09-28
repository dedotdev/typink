'use client';

import { useEffect, useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from '@/components/ui/select';
import { shortenAddress } from '@/lib/utils';
import { formatBalance, useBalances, useTypink } from 'typink';
import { AccountAvatar } from '@/components/shared/account-avatar';
import { LogOutIcon } from 'lucide-react';

function ConnectedWallet() {
  const { connectedWallets } = useTypink();

  const connectedWallet = connectedWallets[0];
  if (!connectedWallet) return null;

  return (
    <div className='flex items-center gap-2 justify-center pb-1'>
      <img className='rounded-md' src={connectedWallet.logo} alt={connectedWallet.name} width={20} height={20} />
      <span className='font-semibold text-sm'>{connectedWallet.name}</span>
    </div>
  );
}

export function AccountSelection() {
  const { accounts, connectedAccount, setConnectedAccount, disconnect, network } = useTypink();
  const addresses = useMemo(() => accounts.map((a) => a.address), [accounts]);
  const balances = useBalances(addresses);

  useEffect(() => {
    if (connectedAccount && accounts.map((one) => one.address).includes(connectedAccount.address)) {
      return;
    }

    setConnectedAccount(accounts[0]);
  }, [accounts, connectedAccount, setConnectedAccount]);

  if (!connectedAccount) {
    return null;
  }

  const { name, address } = connectedAccount;

  return (
    <div className='flex items-center gap-2'>
      <Select
        value={address}
        onValueChange={(selectedAddress) => {
          if (selectedAddress === 'logout') {
            disconnect();
            return;
          }

          const selectedAccount = accounts.find((acc) => acc.address === selectedAddress);
          if (selectedAccount) {
            setConnectedAccount(selectedAccount);
          }
        }}>
        <SelectTrigger className='bg-white'>
          <SelectValue>
            <div className='flex items-center gap-2'>
              <AccountAvatar account={connectedAccount} className='mt-1' />
              <span className='font-semibold text-sm'>{name}</span>
              <span className='text-sm font-normal text-muted-foreground hidden sm:inline'>
                ({shortenAddress(address)})
              </span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent className='w-80'>
          <div className='p-2'>
            <ConnectedWallet />
          </div>
          <SelectSeparator />
          {accounts.map((one) => (
            <SelectItem
              key={one.address}
              value={one.address}
              className='*:[span]:first:hidden *:[span]:last:block *:[span]:last:w-full data-[state=checked]:bg-green-200/30 pr-2'>
              <div className='flex items-start w-full gap-3 py-1'>
                <AccountAvatar account={one} size={32} className='mt-1' />
                <div className='w-full flex flex-col gap-1'>
                  <div className='flex justify-between items-center gap-2 w-full'>
                    <span className='font-medium'>{one.name}</span>
                    <span className='text-xs text-muted-foreground'>{shortenAddress(one.address)}</span>
                  </div>
                  <span className='text-xs text-muted-foreground'>
                    Balance: {formatBalance(balances[one.address]?.free, network)}
                  </span>
                </div>
              </div>
            </SelectItem>
          ))}
          <SelectSeparator />
          <SelectItem key='logout' value='logout' className='py-2'>
            <div className='flex items-center gap-2'>
              <LogOutIcon className='w-4 h-4' />
              <span>Logout</span>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
