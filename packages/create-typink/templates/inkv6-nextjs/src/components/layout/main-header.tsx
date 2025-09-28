'use client';

import { AccountSelection } from '@/components/shared/account-selection';
import { WalletSelection } from '@/components/shared/wallet-selection';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { useTypink } from 'typink';
import Link from 'next/link';
import { TypinkLogo } from '@/components/shared/icons';

export function MainHeader() {
  const { accounts } = useTypink();

  return (
    <div className='border-b border-gray-200 dark:border-gray-800'>
      <div className='max-w-5xl px-4 mx-auto flex justify-between items-center gap-4 h-16'>
        <Link href='/' className='w-24'>
          <TypinkLogo />
        </Link>
        <div className='flex items-center gap-3'>
          {accounts.length > 0 ? <AccountSelection /> : <WalletSelection />}
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}
