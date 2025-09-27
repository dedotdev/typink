'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Link2 } from 'lucide-react';
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
      size='lg'
      variant='outline'
      className='w-full justify-start items-center gap-4 h-14'>
      <img className='rounded-sm' src={logo} alt={`${name}`} width={20} height={20} />
      {installed ? (
        <>
          <span>{name}</span>
        </>
      ) : (
        <>
          <span>Install {name}</span>
        </>
      )}
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
        <Button size='default' variant='outline' className={`${buttonClassName}`}>
          {buttonLabel} <Link2 />
        </Button>
      </DialogTrigger>

      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Connect Wallet</DialogTitle>
          <DialogDescription>Select a wallet to connect</DialogDescription>
        </DialogHeader>
        <div className='flex flex-col gap-3'>
          {wallets.map((one) => (
            <WalletButton key={one.id} walletInfo={one} afterSelectWallet={() => setIsOpen(false)} />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
