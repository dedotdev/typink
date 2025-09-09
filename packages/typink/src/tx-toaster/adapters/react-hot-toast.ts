import { ReactNode } from 'react';
import type { toast as hotToast } from 'react-hot-toast';
import { ToastAdapter, ToastOptions } from '../types.js';
import { assert } from 'dedot/utils';

export class ReactHotToastAdapter implements ToastAdapter {
  constructor(private toast: typeof hotToast) {}

  show(content: ReactNode, options?: ToastOptions): string {
    const { type = 'loading', duration = Infinity } = options || {};

    const toastFn = this.toast[type];
    assert(toastFn, `Invalid toast type ${type}`);

    return toastFn(content as string, { duration });
  }

  update(id: string | number, content: ReactNode, options?: ToastOptions): void {
    const { type = 'loading', duration = Infinity } = options || {};

    const toastFn = this.toast[type];
    assert(toastFn, `Invalid toast type ${type}`);

    toastFn(content as string, { duration, id: id.toString() });
  }

  dismiss(id: string | number): void {
    this.toast.dismiss(id as string);
  }
}
