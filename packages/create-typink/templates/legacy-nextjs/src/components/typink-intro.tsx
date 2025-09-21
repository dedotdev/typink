import { ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GithubSvgIcon } from '@/components/shared/icons';

export function TypinkIntro() {
  return (
    <div className='relative z-10 flex flex-col items-center justify-center px-4 py-20'>
      <div className='text-center space-y-6'>
        <h1 className='text-4xl font-medium tracking-tight text-foreground mb-2'>
          The ultimate toolkit for your <span className='italic'>ink! dApp</span> development,
        </h1>

        <p className='text-4xl font-medium bg-gradient-to-r from-[#DE21A6] via-[#DE21A6] to-[#FD6F8E] bg-clip-text text-transparent'>
          powered by Dedot
        </p>

        {/* Action Buttons */}
        <div className='flex flex-col sm:flex-row gap-4 justify-center items-center pt-8'>
          <Button variant='outline' size='lg' className='min-w-[180px]' asChild>
            <a
              href='https://github.com/dedotdev/typink'
              target='_blank'
              rel='noopener noreferrer'
              className='flex items-center gap-2'>
              Github
              <GithubSvgIcon />
            </a>
          </Button>

          <Button
            size='lg'
            className='min-w-[180px] bg-gradient-to-r from-[#DE21A6] to-[#FD6F8E] hover:from-[#DE21A6]/90 hover:to-[#FD6F8E]/90 text-white border-0'
            asChild>
            <a
              href='https://docs.dedot.dev/typink/getting-started'
              target='_blank'
              rel='noopener noreferrer'
              className='flex items-center gap-2'>
              Getting Started
              <ArrowUpRight className='h-5 w-5' />
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
