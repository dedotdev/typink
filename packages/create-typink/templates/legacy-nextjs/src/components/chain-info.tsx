'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useBlockInfo, useTypink } from 'typink';

export function ChainInfo() {
  const { network, ready, networkConnection } = useTypink();
  const { best } = useBlockInfo();

  return (
    <Card className='bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-800'>
      <CardHeader className='pb-4'>
        <div className='flex items-center justify-between'>
          <CardTitle className='text-lg font-medium'>Chain Info</CardTitle>
        </div>
        <p className='text-sm text-muted-foreground'>
          {ready ? `Connected to ${network.name}` : 'Connect a network to use'}
        </p>
      </CardHeader>

      <CardContent className='space-y-4'>
        {/* Network Header */}
        <div className='flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg'>
          <img src={network.logo} alt={network.name} width={32} height={32} className='rounded-full' />
          <div className='font-semibold text-lg'>{network.name}</div>
        </div>

        {/* Network Details */}
        <div className='space-y-3'>
          <div className='flex justify-between items-center py-2'>
            <span className='text-sm text-muted-foreground'>Network ID</span>
            <span className='text-sm font-mono'>_{network.id}</span>
          </div>

          <div className='flex justify-between items-center py-2'>
            <span className='text-sm text-muted-foreground'>Network type</span>
            <div className='flex items-center gap-1.5'>
              <div className='w-2 h-2 bg-blue-500 rounded-full' />
              <span className='text-sm font-medium'>Mainnet</span>
            </div>
          </div>

          <div className='flex justify-between items-center py-2'>
            <span className='text-sm text-muted-foreground'>Connection status</span>
            <div className='flex items-center gap-1.5'>
              <div className={`w-2 h-2 rounded-full ${ready ? 'bg-green-500' : 'bg-gray-400'}`} />
              <span className='text-sm font-medium'>{ready ? 'Connected' : 'Not Connected'}</span>
            </div>
          </div>

          <div className='flex justify-between items-center py-2'>
            <span className='text-sm text-muted-foreground'>Connection type</span>
            <div className='flex items-center gap-1.5'>
              <div className='w-2 h-2 bg-gray-400 rounded-full' />
              <span className='text-sm font-medium'>{networkConnection?.provider || 'RPC Endpoint'}</span>
            </div>
          </div>

          <div className='flex justify-between items-center py-2'>
            <span className='text-sm text-muted-foreground'>Token symbol</span>
            <span className='text-sm font-medium'>{network.symbol}</span>
          </div>

          <div className='flex justify-between items-center py-2'>
            <span className='text-sm text-muted-foreground'>Token decimals</span>
            <span className='text-sm font-mono'>{network.decimals}</span>
          </div>

          <div className='flex justify-between items-center py-2'>
            <span className='text-sm text-muted-foreground'>Best block</span>
            <span className='text-sm font-mono text-pink-500'>{best?.number}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
