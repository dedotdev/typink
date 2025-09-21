'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Loader2Icon } from 'lucide-react';
import { ExtensionWallet, useTypink, Wallet } from 'typink';

interface WalletButtonProps {
  walletInfo: Wallet;
  afterSelectWallet?: () => void;
}

const WalletButton = ({ walletInfo, afterSelectWallet }: WalletButtonProps) => {
  const { name, id, logo, ready, installed } = walletInfo;
  const { connectWallet, connectedWalletIds, disconnect } = useTypink();

  const doConnectWallet = () => {
    if (!installed) {
      if (walletInfo instanceof ExtensionWallet) {
        window.open(walletInfo.installUrl);
      }

      return;
    }

    connectedWalletIds.length > 0 && disconnect(connectedWalletIds[0]);
    connectWallet(id);
    afterSelectWallet && afterSelectWallet();
  };

  return (
    <Button
      onClick={doConnectWallet}
      disabled={!installed}
      size='lg'
      variant='outline'
      className='w-full justify-start items-center gap-4'>
      {installed && !ready ? (
        <Loader2Icon className='w-6 h-6 animate-spin' />
      ) : (
        <img className='rounded-md' src={logo} alt={`${name}`} width={20} height={20} />
      )}
      <span>{name}</span>
    </Button>
  );
};

interface WalletSelectionProps {
  buttonLabel?: string;
  buttonClassName?: string;
}

export function WalletSelection({ buttonLabel = 'Connect Wallet', buttonClassName = '' }: WalletSelectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { wallets } = useTypink();

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size='default' variant='outline' className={buttonClassName}>
          {buttonLabel}
        </Button>
      </DialogTrigger>

      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Select Wallet to Connect</DialogTitle>
        </DialogHeader>
        <div className='flex flex-col gap-3 mt-4'>
          {wallets.map((one) => (
            <WalletButton key={one.id} walletInfo={one} afterSelectWallet={() => setIsOpen(false)} />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
