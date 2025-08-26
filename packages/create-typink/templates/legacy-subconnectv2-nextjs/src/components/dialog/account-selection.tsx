'use client';

import { useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { shortenAddress } from '@/lib/utils';
import { formatBalance, useBalances, useTypink } from 'typink';
import { LogOutIcon } from 'lucide-react';
import { useWalletConnector } from '@/providers/wallet-connector-provider';

function ConnectedWallet() {
  const { wallet } = useWalletConnector();
  if (!wallet) return null;

  return (
    <div className='flex items-center gap-3 justify-center pb-2'>
      <div dangerouslySetInnerHTML={{ __html: wallet?.icon }} className='w-6' />
      <span className='font-semibold text-sm'>{wallet?.label}</span>
    </div>
  );
}

export default function AccountSelection() {
  const { wallet, connectedAccount, setConnectedAccount, signOut } = useWalletConnector();
  const { network } = useTypink();

  const accounts = useMemo(
    () =>
      (wallet?.accounts || []).map((a) => ({
        address: a.address,
        name: a.uns?.name,
        source: wallet?.label || 'subconnect',
      })),
    [wallet],
  );
  const addresses = useMemo(() => accounts.map((a) => a.address), [accounts]);
  const balances = useBalances(addresses);

  useEffect(() => {
    if (connectedAccount && accounts.map((one) => one.address).includes(connectedAccount.address)) {
      return;
    }

    setConnectedAccount(accounts[0]);
  }, [accounts]);

  if (!connectedAccount) {
    return <></>;
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

      <Button variant='outline' size='icon' onClick={signOut}>
        <LogOutIcon />
      </Button>
    </div>
  );
}
