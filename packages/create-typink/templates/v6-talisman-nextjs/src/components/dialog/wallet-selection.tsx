'use client';

import { useWalletConnector } from '@/providers/wallet-connector-provider';
import { Button } from '@/components/ui/button';
import { WalletSelect } from '@talismn/connect-components';
import { useTypink } from 'typink';
import { useState } from 'react';

export default function WalletSelection() {
  const { appName } = useTypink();
  const [open, setOpen] = useState(false);
  const { connectWallet } = useWalletConnector();

  return (
    <WalletSelect
      dappName={appName}
      open={open}
      triggerComponent={<Button onClick={() => setOpen(true)}>Connect Wallet</Button>}
      header={<p>Connect to your wallet</p>}
      showAccountsList={true}
      onWalletSelected={connectWallet}
    />
  );
}
