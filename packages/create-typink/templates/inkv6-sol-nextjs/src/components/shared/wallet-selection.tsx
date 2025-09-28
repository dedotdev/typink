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
import { Link2, Download } from 'lucide-react';
import { ExtensionWallet, useTypink, Wallet } from 'typink';
import { cn } from '@/lib/utils';

interface WalletButtonProps {
  walletInfo: Wallet;
  afterSelectWallet?: () => void;
}

const WalletButton = ({ walletInfo, afterSelectWallet }: WalletButtonProps) => {
  const { name, id, logo, installed } = walletInfo;
  const { connectWallet, connectedWalletIds, disconnect } = useTypink();

  const doConnectWallet = async () => {
    if (!installed) {
      if (walletInfo instanceof ExtensionWallet) {
        window.open(walletInfo.installUrl);
      }

      return;
    }

    connectedWalletIds.length > 0 && disconnect(connectedWalletIds[0]);
    await connectWallet(id);
    afterSelectWallet && afterSelectWallet();
  };

  return (
    <div
      className='flex items-center justify-between p-4 border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer group'
      onClick={doConnectWallet}>
      <div className='flex items-center gap-3'>
        <img className='rounded-sm' src={logo} alt={`${name}`} width={32} height={32} />
        <div className='flex flex-col'>
          <span className='font-medium text-sm'>{name}</span>
          {!installed && <span className='text-xs text-red-500'>Not Installed</span>}
        </div>
      </div>
      <Button
        size='sm'
        className={cn(
          installed
            ? 'bg-green-50 dark:bg-green-900/20 text-green-600 hover:text-green-700 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-xl w-28'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl w-28',
        )}
        onClick={(e) => {
          e.stopPropagation();
          doConnectWallet();
        }}>
        {installed ? (
          <>
            Connect
            <Link2 className='w-3 h-3' />
          </>
        ) : (
          <>
            Install
            <Download className='w-3 h-3' />
          </>
        )}
      </Button>
    </div>
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

      <DialogContent className='sm:max-w-2xl'>
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
