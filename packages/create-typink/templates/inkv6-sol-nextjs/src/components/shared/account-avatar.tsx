'use client';

import { Identicon } from '@dedot/react-identicon';
import { TypinkAccount, useTypink } from 'typink';
import Image from 'next/image';

interface AccountAvatarProps {
  account: TypinkAccount;
  size?: number;
  showWalletIndicator?: boolean;
  className?: string;
}

export function AccountAvatar({ account, size = 32, showWalletIndicator = true, className = '' }: AccountAvatarProps) {
  const { wallets } = useTypink();

  // Helper function to get wallet by account source
  const getWalletBySource = (source: string) => wallets.find((wallet) => wallet.id === source);

  const wallet = getWalletBySource(account.source);

  // Calculate wallet indicator size based on avatar size
  const indicatorSize = Math.max(8, Math.round(size * 0.3));
  const indicatorIconSize = Math.max(4, Math.round(indicatorSize * 0.75));

  return (
    <div className={`relative inline-block ${className}`}>
      <Identicon value={account.address} theme='polkadot' size={size} />

      {/* Wallet indicator */}
      {showWalletIndicator && wallet && (
        <div
          className='absolute bottom-[2px] right-[-1px] flex items-center justify-center bg-white border border-gray-300 rounded-full overflow-hidden'
          style={{
            width: `${indicatorSize}px`,
            height: `${indicatorSize}px`,
          }}>
          <Image
            src={wallet.logo}
            alt={wallet.name}
            width={indicatorIconSize}
            height={indicatorIconSize}
            className='rounded-full'
          />
        </div>
      )}
    </div>
  );
}
