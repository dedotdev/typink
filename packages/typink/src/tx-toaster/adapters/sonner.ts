import { ReactNode } from 'react';
import type { toast as sonnerToast } from 'sonner';
import { ToastAdapter, ToastOptions } from '../types.js';

export class SonnerAdapter implements ToastAdapter {
  constructor(private toast: typeof sonnerToast) {}

  show(content: ReactNode, options?: ToastOptions): string | number {
    const { type = 'info', duration = Infinity, ...rest } = options || {};

    switch (type) {
      case 'loading':
        return this.toast.loading(content, { duration, ...rest });
      case 'success':
        return this.toast.success(content, { duration, ...rest });
      case 'error':
        return this.toast.error(content, { duration, ...rest });
      case 'info':
      default:
        return this.toast.info(content, { duration, ...rest });
    }
  }

  update(id: string | number, content: ReactNode, options?: ToastOptions): void {
    const { type = 'loading', duration = Infinity } = options || {};

    switch (type) {
      case 'loading':
        this.toast.loading(content, { id, duration });
        break;
      case 'success':
        this.toast.success(content, { id, duration });
        break;
      case 'error':
        this.toast.error(content, { id, duration });
        break;
      case 'info':
      default:
        this.toast.info(content, { id, duration });
        break;
    }
  }

  dismiss(id: string | number): void {
    this.toast.dismiss(id);
  }
}
