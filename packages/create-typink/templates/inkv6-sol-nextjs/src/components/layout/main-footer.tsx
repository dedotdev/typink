'use client';

import { NetworkSelection } from '@/components/shared/network-selection';
import { GithubSvgIcon, XSvgIcon } from '@/components/shared/icons';

export function MainFooter() {
  return (
    <div className='border-t border-gray-200 dark:border-gray-800'>
      <div className='max-w-5xl px-4 mx-auto flex justify-between items-center gap-4 py-4'>
        <div className='flex gap-6'>
          <a href='https://twitter.com/realsinzii' target='_blank' rel='noopener noreferrer'>
            <XSvgIcon />
          </a>
          <a href='https://github.com/dedotdev/typink' target='_blank' rel='noopener noreferrer'>
            <GithubSvgIcon />
          </a>
        </div>
        <NetworkSelection />
      </div>
    </div>
  );
}
