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

  const getStatusText = () => {
    if (!installed) return 'Not Installed';
  };

  const getActionText = () => {
    if (!installed) return 'Install';
    return 'Connect';
  };

  return (
    <div
      className='flex items-center justify-between p-4 border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer group'
      onClick={doConnectWallet}>
      <div className='flex items-center gap-3'>
        <img className='rounded-sm' src={logo} alt={`${name}`} width={32} height={32} />
        <div className='flex flex-col'>
          <span className='font-medium text-sm'>{name}</span>
          <span className='text-xs text-red-500'>{getStatusText()}</span>
        </div>
      </div>
      <Button
        size='sm'
        variant='ghost'
        className='text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 font-medium'
        onClick={(e) => {
          e.stopPropagation();
          doConnectWallet();
        }}>
        {getActionText()}
      </Button>
    </div>
  );
};

interface WalletSelectionProps {
  buttonLabel?: string;
  buttonClassName?: string;
}

// Categorize wallets based on their name and type
const categorizeWallets = (wallets: Wallet[]) => {
  const categories = {
    Hardware: [] as Wallet[],
    Remote: [] as Wallet[],
    'Web Signer': [] as Wallet[],
    Extensions: [] as Wallet[],
  };

  wallets.forEach((wallet) => {
    const name = wallet.name.toLowerCase();
    if (name.includes('ledger')) {
      categories.Hardware.push(wallet);
    } else if (name.includes('walletconnect')) {
      categories.Remote.push(wallet);
    } else if (name.includes('signer') || name.includes('dedot')) {
      categories['Web Signer'].push(wallet);
    } else {
      categories.Extensions.push(wallet);
    }
  });

  return categories;
};

export function WalletSelection({ buttonLabel = 'Connect Wallet', buttonClassName = '' }: WalletSelectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { wallets } = useTypink();
  const categorizedWallets = categorizeWallets(wallets);

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
