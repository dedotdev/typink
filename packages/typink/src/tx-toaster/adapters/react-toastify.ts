import { ReactNode } from 'react';
import type { toast as toastifyToast } from 'react-toastify';
import { ToastAdapter, ToastOptions } from '../types.js';

export class ReactToastifyAdapter implements ToastAdapter {
  constructor(private toast: typeof toastifyToast) {}

  show(content: ReactNode, options?: ToastOptions): string | number {
    const { type = 'info', duration, isLoading = false } = options || {};

    const autoClose = duration === Infinity ? false : duration;

    return this.toast(content, {
      type,
      autoClose,
      isLoading,
      closeOnClick: false,
    });
  }

  update(id: string | number, content: ReactNode, options?: ToastOptions): void {
    const { type = 'loading', duration, isLoading } = options || {};

    const autoClose = duration === Infinity ? false : duration;

    this.toast.update(id, {
      render: content,
      type,
      autoClose,
      isLoading: isLoading ?? type === 'loading',
      closeOnClick: false,
    });
  }

  dismiss(id: string | number): void {
    this.toast.dismiss(id);
  }
}
