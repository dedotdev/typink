import { ReactNode } from 'react';
import type { toast as sonnerToast } from 'sonner';
import { ToastAdapter, ToastOptions } from '../types.js';
import { assert } from 'dedot/utils';

export class SonnerAdapter implements ToastAdapter {
  constructor(private toast: typeof sonnerToast) {}

  show(content: ReactNode, options?: ToastOptions): string | number {
    const { type = 'info', duration = Infinity, ...rest } = options || {};

    const toastFn = this.toast[type];
    assert(toastFn, `Invalid toast type ${type}`);

    return toastFn(content, { duration, ...rest });
  }

  update(id: string | number, content: ReactNode, options?: ToastOptions): void {
    const { type = 'loading', duration = Infinity } = options || {};

    const toastFn = this.toast[type];
    assert(toastFn, `Invalid toast type ${type}`);

    toastFn(content, { id, duration });
  }

  dismiss(id: string | number): void {
    this.toast.dismiss(id);
  }
}
