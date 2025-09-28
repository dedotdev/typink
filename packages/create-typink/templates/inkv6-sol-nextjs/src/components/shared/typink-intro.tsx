import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GithubSvgIcon, TypinkTextLogo } from '@/components/shared/icons';

export function TypinkIntro() {
  return (
    <div className='relative z-10 flex flex-col items-center justify-center px-4 py-20'>
      <div className='text-center space-y-6'>
        <div className='flex items-center justify-center'>
          <TypinkTextLogo width={250} />
        </div>

        <h1 className='text-4xl font-medium tracking-tight text-foreground'>
          The ultimate toolkit for dapp development on Polkadot
        </h1>

        <p className='text-4xl font-medium bg-gradient-to-r from-[#DE21A6] via-[#DE21A6] to-[#FD6F8E] bg-clip-text text-transparent'>
          Powered by Dedot!
        </p>

        {/* Action Buttons */}
        <div className='flex flex-col sm:flex-row gap-4 justify-center items-center pt-8'>
          <Button
            size='xl'
            className='min-w-[184px] rounded-[14px] bg-gradient-to-r from-[#DE21A6] to-[#FD6F8E] text-white border-0 transition-all hover:shadow-lg hover:shadow-pink-500/25'
            asChild>
            <a
              href='https://docs.dedot.dev/typink/getting-started'
              target='_blank'
              rel='noopener noreferrer'
              className='flex items-center gap-2'>
              Getting Started
              <Send className='h-5 w-5' />
            </a>
          </Button>

          <Button
            variant='outline'
            size='xl'
            className='min-w-[184px] rounded-[14px] transition-all hover:shadow-lg hover:shadow-pink-500/25'
            asChild>
            <a
              href='https://github.com/dedotdev/typink'
              target='_blank'
              rel='noopener noreferrer'
              className='flex items-center gap-2'>
              Github
              <GithubSvgIcon />
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
