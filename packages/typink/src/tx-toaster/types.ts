import { ReactNode } from 'react';
import { ISubmittableResult, TxStatus } from 'dedot/types';

export type TxToaster = {
  onTxProgress: (progress: ISubmittableResult) => void;
  onTxError: (e: Error) => void;
};

export type ToastType = 'loading' | 'success' | 'error';

export interface ToastOptions {
  id?: string | number;
  duration?: number;
  type?: ToastType;
}

export interface ToastAdapter {
  show(content: ReactNode, options?: ToastOptions): string | number;
  update(id: string | number, content: ReactNode, options?: ToastOptions): void;
  dismiss(id: string | number): void;
}

export interface TxProgressProps {
  message: string;
  status: TxStatus;
}

export interface TxToasterConfig {
  adapter: ToastAdapter;
  initialMessage?: string;
  autoCloseDelay?: number;
}
