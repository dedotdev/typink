'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2Icon } from 'lucide-react';
import { useTypink } from 'typink';

function NetworkStatusIndicator() {
  const { ready } = useTypink();

  if (ready) {
    return <div className='w-3 h-3 bg-green-500 rounded-full' />;
  } else {
    return <Loader2Icon className='w-3 h-3 animate-spin' />;
  }
}

export function NetworkSelection() {
  const { network, setNetwork, supportedNetworks } = useTypink();

  return (
    <Select value={network.id} onValueChange={setNetwork}>
      <SelectTrigger className='w-fit min-w-[120px] bg-white'>
        <SelectValue>
          <div className='flex items-center gap-2'>
            <img src={network.logo} alt={network.name} width={22} height={22} className='rounded' />
            <span className='hidden sm:inline'>{network.name}</span>
            <div className='ml-2'>
              <NetworkStatusIndicator />
            </div>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {Object.values(supportedNetworks).map((one) => (
          <SelectItem key={one.id} value={one.id}>
            <div className='flex items-center gap-2'>
              <img src={one.logo} alt={one.name} width={18} height={18} className='rounded' />
              <span>{one.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
