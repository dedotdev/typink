import { TypinkIntro } from '@/components/typink-intro';
import { ChainInfo } from '@/components/chain-info';
import { AccountInfo } from '@/components/account-info';
import { GreeterBoard } from '@/components/greeter-board';
import { BalanceInsufficientAlert } from '@/components/shared/balance-insufficient-alert';

export default function Home() {
  return (
    <div className='space-y-10'>
      <TypinkIntro />

      <div className='mx-auto px-4 pb-16'>
        <BalanceInsufficientAlert />

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mx-auto'>
          <div>
            <ChainInfo />
          </div>

          <div className='flex flex-col gap-6'>
            <AccountInfo />
            <GreeterBoard />
          </div>
        </div>
      </div>
    </div>
  );
}
