import React from 'react';
import { ISubmittableResult } from 'dedot/types';
import { TxToaster, ToastAdapter, TxToasterConfig, TxToasterOptions, TxToasterMessages } from './types.js';
import { TxProgress } from './TxProgress.js';

// Re-export types and components
export * from './types.js';
export { TxProgress } from './TxProgress.js';
export { SonnerAdapter } from './adapters/sonner.js';
export { ReactToastifyAdapter } from './adapters/react-toastify.js';
export { ReactHotToastAdapter } from './adapters/react-hot-toast.js';

let globalAdapter: ToastAdapter | null = null;
let globalConfig: Partial<TxToasterConfig> = {
  initialMessage: 'Signing Transaction...',
  autoCloseDelay: 5000,
  messages: {
    inProgress: 'Transaction In Progress...',
    successful: 'Transaction Successful',
    failed: 'Transaction Failed',
  },
} as Partial<TxToasterConfig>;

/**
 * Setup the global toast adapter for transaction toasters
 */
export function setupTxToaster(config: TxToasterConfig): void {
  globalAdapter = config.adapter;
  if (config.initialMessage !== undefined) {
    globalConfig.initialMessage = config.initialMessage;
  }
  if (config.autoCloseDelay !== undefined) {
    globalConfig.autoCloseDelay = config.autoCloseDelay;
  }
  if (config.messages !== undefined) {
    globalConfig.messages = { ...globalConfig.messages, ...config.messages };
  }
}

// TODO show dispatchError detailed error in failed case

/**
 * Creates a toast notification for transaction progress and manages its updates.
 *
 * @param config - Either a string for the initial message, or a configuration object
 * @returns An object containing onTxProgress and onTxError methods.
 */
export function txToaster(config?: string | TxToasterOptions): TxToaster {
  // Parse config parameter
  let initialMessage: string | undefined;
  let adapter: ToastAdapter | undefined;
  let networkId: string | undefined;
  let autoCloseDelay: number | undefined;
  let messages: TxToasterMessages | undefined;

  if (typeof config === 'string') {
    initialMessage = config;
  } else if (config) {
    initialMessage = config.initialMessage;
    adapter = config.adapter;
    networkId = config.networkId;
    autoCloseDelay = config.autoCloseDelay;
    messages = config.messages;
  }

  const toastAdapter = adapter || globalAdapter;

  if (!toastAdapter) {
    throw new TypeError('No toast adapter configured. Please call setupTxToaster() first or provide an adapter.');
  }

  const message = initialMessage || globalConfig.initialMessage || 'Signing Transaction...';
  const finalAutoCloseDelay = autoCloseDelay || globalConfig.autoCloseDelay || 5000;

  const finalMessages: TxToasterMessages = {
    ...globalConfig.messages,
    ...messages,
  };

  const toastId = toastAdapter.show(message, {
    type: 'loading',
    duration: Infinity,
  });

  const onTxProgress = (progress: ISubmittableResult) => {
    let done = false;
    let toastMessage: string = finalMessages.inProgress || 'Transaction In Progress...';
    let toastType: 'loading' | 'success' | 'error' = 'loading';

    const { status, dispatchError } = progress;
    const succeeded = !dispatchError;

    if (status.type === 'Finalized') {
      done = true;
      toastType = succeeded ? 'success' : 'error';
      toastMessage = succeeded
        ? finalMessages.successful || 'Transaction Successful'
        : finalMessages.failed || 'Transaction Failed';
    } else if (status.type === 'Invalid' || status.type === 'Drop') {
      done = true;
      toastType = 'error';
      toastMessage = finalMessages.failed || 'Transaction Failed';
    }

    const body = React.createElement(TxProgress, { message: toastMessage, status, networkId });

    toastAdapter.update(toastId, body, {
      type: toastType,
      duration: done ? finalAutoCloseDelay : Infinity,
    });
  };

  const onTxError = (e: Error) => {
    toastAdapter.update(toastId, React.createElement('p', null, e.message), {
      type: 'error',
      duration: finalAutoCloseDelay,
    });
  };

  return {
    onTxProgress,
    onTxError,
  };
}
