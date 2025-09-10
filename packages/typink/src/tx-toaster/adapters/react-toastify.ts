import { ReactNode } from 'react';
import type { toast as toastifyToast, TypeOptions } from 'react-toastify';
import { ToastAdapter, ToastOptions, ToastType } from '../types.js';

export class ReactToastifyAdapter implements ToastAdapter {
  constructor(private toast: typeof toastifyToast) {}

  private toToastifyType(type: ToastType): TypeOptions {
    switch (type) {
      case 'success':
      case 'error':
        return type;
      default:
        return 'info';
    }
  }

  show(content: ReactNode, options?: ToastOptions): string | number {
    const { type = 'loading', duration = Infinity } = options || {};

    const autoClose = duration === Infinity ? false : duration;
    const toastifyType = this.toToastifyType(type);

    return this.toast(content as any, {
      type: toastifyType,
      autoClose,
      isLoading: type === 'loading',
      closeOnClick: false,
    });
  }

  update(id: string | number, content: ReactNode, options?: ToastOptions): void {
    const { type = 'loading', duration = Infinity } = options || {};

    const autoClose = duration === Infinity ? false : duration;
    const toastifyType = this.toToastifyType(type);

    this.toast.update(id, {
      render: content as any,
      type: toastifyType,
      autoClose,
      isLoading: type === 'loading',
      closeOnClick: false,
    });
  }

  dismiss(id: string | number): void {
    this.toast.dismiss(id);
  }
}
