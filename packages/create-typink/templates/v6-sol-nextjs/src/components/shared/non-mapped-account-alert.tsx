'use client';

import { useCheckMappedAccount } from 'typink';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import MapAccountButton from './map-account-button';

export function NonMappedAccountAlert() {
  const { isMapped, isLoading, refresh } = useCheckMappedAccount();

  if (isLoading || isMapped !== false) return null;

  const handleMappingSuccess = async () => {
    await refresh();
  };

  return (
    <Alert variant='warning' className='mb-4'>
      <AlertTriangle className='h-4 w-4' />
      <AlertTitle>Account Not Mapped</AlertTitle>
      <AlertDescription>
        <p className='mb-2'>
          Your account needs to be mapped before interacting with ink! v6 contracts on this network.
        </p>
        <div className='mt-2 flex items-center'>
          <MapAccountButton variant='default' onSuccess={handleMappingSuccess} />
        </div>
      </AlertDescription>
    </Alert>
  );
}
