'use client';

import { useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { shortenAddress } from '@/lib/utils';
import { formatBalance, useBalances, useTypink } from 'typink';
import { LogOutIcon } from 'lucide-react';

function ConnectedWallet() {
  const { connectedWallets } = useTypink();

  const connectedWallet = connectedWallets[0];
  if (!connectedWallet) return null;

  return (
    <div className='flex items-center gap-3 justify-center pb-2'>
      <img src={connectedWallet?.logo} alt={connectedWallet?.name} width={24} height={24} />
      <span className='font-semibold text-sm'>
        {connectedWallet?.name} - v{connectedWallet?.version}
      </span>
    </div>
  );
}

export default function AccountSelection() {
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
          const selectedAccount = accounts.find((acc) => acc.address === selectedAddress);
          if (selectedAccount) {
            setConnectedAccount(selectedAccount);
          }
        }}>
        <SelectTrigger className='w-fit min-w-[180px]'>
          <SelectValue>
            <div className='flex items-center gap-2'>
              <span className='font-semibold text-sm'>{name}</span>
              <span className='text-sm font-normal text-muted-foreground'>({shortenAddress(address)})</span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent className='w-64'>
          <div className='p-2 border-b'>
            <ConnectedWallet />
          </div>
          {accounts.map((one) => (
            <SelectItem key={one.address} value={one.address}>
              <div className='flex flex-col items-start gap-1 py-1'>
                <span className='font-medium'>{one.name}</span>
                <span className='text-xs text-muted-foreground'>Address: {shortenAddress(one.address)}</span>
                <span className='text-xs text-muted-foreground'>
                  Balance: {formatBalance(balances[one.address]?.free, network)}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button variant='outline' size='icon' onClick={() => disconnect()}>
        <LogOutIcon />
      </Button>
    </div>
  );
}
