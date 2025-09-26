'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useBlockInfo, useTypink } from 'typink';
import { Props } from '@/lib/types';

export function ChainInfo({ className = '' }: Props) {
  const { network, ready, networkConnection } = useTypink();
  const { best } = useBlockInfo();

  return (
    <Card className={`bg-gray-200/70 dark:bg-gray-900/50 border-none shadow-none gap-4 ${className}`}>
      <CardHeader className='pb-4'>
        <div className='flex items-center justify-between'>
          <CardTitle className='text-2xl font-medium'>Chain Info</CardTitle>
        </div>
        <p className='text-sm text-muted-foreground'>
          {ready ? `Connected to ${network.name}` : `Connecting to ${network.name}`}
        </p>
      </CardHeader>

      <CardContent>
        <div className='bg-white/40 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden'>
          {/* Network Header */}
          <div className='flex justify-center items-center gap-3 p-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-800'>
            <img src={network.logo} alt={network.name} width={32} height={32} className='rounded-full' />
            <div className='font-semibold text-lg'>{network.name}</div>
          </div>

          {/* Network Section */}
          <div className='flex justify-between items-center px-6 py-4'>
            <span className='text-sm text-muted-foreground'>Network ID</span>
            <span className='text-sm font-mono'>{network.id}</span>
          </div>
          <div className='flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-800'>
            <span className='text-sm text-muted-foreground'>Network type</span>
            <div className='flex items-center gap-1.5'>
              <div className='w-2 h-2 bg-blue-500 rounded-full' />
              <span className='text-sm font-medium'>Mainnet</span>
            </div>
          </div>

          {/* Connection Section */}
          <div className='flex justify-between items-center px-6 py-4'>
            <span className='text-sm text-muted-foreground'>Connection status</span>
            <div className='flex items-center gap-1.5'>
              <div className={`w-2 h-2 rounded-full ${ready ? 'bg-green-500' : 'bg-gray-400'}`} />
              <span className='text-sm font-medium'>{ready ? 'Connected' : 'Not Connected'}</span>
            </div>
          </div>
          <div className='flex justify-between items-center px-6 py-4'>
            <span className='text-sm text-muted-foreground'>Connection type</span>
            <div className='flex items-center gap-1.5'>
              <div className='w-2 h-2 bg-gray-400 rounded-full' />
              <span className='text-sm font-medium'>{networkConnection?.provider || 'RPC Endpoint'}</span>
            </div>
          </div>

          <div className='flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-800'>
            <span className='text-sm text-muted-foreground'>Best block</span>
            <span className='text-sm font-mono text-pink-500'>{best?.number}</span>
          </div>

          {/* Token Section */}
          <div className='flex justify-between items-center px-6 py-4'>
            <span className='text-sm text-muted-foreground'>Token symbol</span>
            <span className='text-sm font-medium'>{network.symbol}</span>
          </div>
          <div className='flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-800'>
            <span className='text-sm text-muted-foreground'>Token decimals</span>
            <span className='text-sm font-mono'>{network.decimals}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
