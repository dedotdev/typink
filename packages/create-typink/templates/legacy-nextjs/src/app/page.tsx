import Image from 'next/image';
import { GreeterBoard } from '@/components/GreeterBoard';

export default function Home() {
  return (
    <div className='container mx-auto px-4 py-16 space-y-16'>
      {/* Welcome Section */}
      <div className='flex flex-col items-center justify-center'>
        <div className='flex flex-col gap-8 items-center text-center max-w-2xl'>
          <Image className='dark:invert' src='/next.svg' alt='Next.js logo' width={180} height={38} priority />

          <div className='space-y-4'>
            <h1 className='text-4xl font-bold tracking-tight'>Welcome to Typink Template</h1>
            <p className='text-lg text-muted-foreground'>
              A Next.js template with ShadCN UI components and Typink integration for Polkadot development.
            </p>
          </div>

          <div className='flex gap-4 items-center flex-col sm:flex-row'>
            <a
              className='rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5'
              href='https://docs.dedot.dev/typink'
              target='_blank'
              rel='noopener noreferrer'>
              View Typink Docs
            </a>
          </div>
        </div>
      </div>

      {/* Greeter Contract Section */}
      <div className='max-w-3xl mx-auto'>
        <GreeterBoard />
      </div>
    </div>
  );
}
