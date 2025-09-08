import { ReactNode } from 'react';
import type { toast as toastifyToast, TypeOptions } from 'react-toastify';
import { ToastAdapter, ToastOptions } from '../types.js';

export class ReactToastifyAdapter implements ToastAdapter {
  constructor(private toast: typeof toastifyToast) {}

  show(content: ReactNode, options?: ToastOptions): string | number {
    const { type = 'info', duration, isLoading = false } = options || {};

    const toastType = this.mapToastType(type);
    const autoClose = duration === Infinity ? false : duration;

    return this.toast(content, {
      type: toastType,
      autoClose,
      isLoading,
      closeOnClick: false,
    });
  }

  update(id: string | number, content: ReactNode, options?: ToastOptions): void {
    const { type = 'loading', duration, isLoading } = options || {};

    const toastType = this.mapToastType(type);
    const autoClose = duration === Infinity ? false : duration;

    this.toast.update(id, {
      render: content,
      type: toastType,
      autoClose,
      isLoading: isLoading ?? type === 'loading',
      closeOnClick: false,
    });
  }

  dismiss(id: string | number): void {
    this.toast.dismiss(id);
  }

  private mapToastType(type: ToastOptions['type']): TypeOptions {
    switch (type) {
      case 'loading':
        return 'default';
      case 'success':
        return 'success';
      case 'error':
        return 'error';
      case 'info':
      default:
        return 'info';
    }
  }
}
