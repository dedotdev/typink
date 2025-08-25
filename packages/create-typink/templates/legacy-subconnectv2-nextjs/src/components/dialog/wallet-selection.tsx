"use client"

import { useWalletConnector } from '@/providers/wallet-connector-provider';
import { Button } from '@/components/ui/button';

export default function WalletSelection() {
  const { connectWallet } = useWalletConnector();

  return (
    <Button onClick={() => connectWallet()}>
      Connect Wallet
    </Button>
  );
}


