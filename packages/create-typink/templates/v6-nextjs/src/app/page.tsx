import { TypinkIntro } from '@/components/shared/typink-intro';
import { ChainInfo } from '@/components/chain-info';
import { AccountInfo } from '@/components/account-info';
import { FlipperBoard } from '@/components/flipper-board';
import { BalanceInsufficientAlert } from '@/components/shared/balance-insufficient-alert';
import { NonMappedAccountAlert } from '@/components/shared/non-mapped-account-alert';

export default function Home() {
  return (
    <div className=''>
      <TypinkIntro />

      <div className='mx-auto px-4 pb-16'>
        <BalanceInsufficientAlert />
        <NonMappedAccountAlert />

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mx-auto'>
          <div>
            <ChainInfo className='h-full' />
          </div>

          <div className='flex flex-col gap-6'>
            <AccountInfo />
            <FlipperBoard />
          </div>
        </div>
      </div>
    </div>
  );
}
