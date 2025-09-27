import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { SonnerAdapter } from '../adapters/sonner.js';
import { ReactToastifyAdapter } from '../adapters/react-toastify.js';
import { ReactHotToastAdapter } from '../adapters/react-hot-toast.js';

describe('Toast Adapters', () => {
  describe('SonnerAdapter', () => {
    let mockToast: any;
    let adapter: SonnerAdapter;

    beforeEach(() => {
      mockToast = {
        loading: vi.fn().mockReturnValue('sonner-1'),
        success: vi.fn().mockReturnValue('sonner-2'),
        error: vi.fn().mockReturnValue('sonner-3'),
        dismiss: vi.fn(),
      };

      adapter = new SonnerAdapter(mockToast);
    });

    describe('show', () => {
      it('should show loading toast with default options', () => {
        const content = React.createElement('div', null, 'Loading...');
        const id = adapter.show(content);

        expect(mockToast.loading).toHaveBeenCalledWith(content, {
          duration: Infinity,
        });
        expect(id).toBe('sonner-1');
      });

      it('should show success toast with custom duration', () => {
        const content = 'Success!';
        const id = adapter.show(content, { type: 'success', duration: 3000 });

        expect(mockToast.success).toHaveBeenCalledWith(content, {
          duration: 3000,
        });
        expect(id).toBe('sonner-2');
      });

      it('should show error toast', () => {
        const content = 'Error occurred';
        const id = adapter.show(content, { type: 'error', duration: 5000 });

        expect(mockToast.error).toHaveBeenCalledWith(content, {
          duration: 5000,
        });
        expect(id).toBe('sonner-3');
      });


      it('should throw error for invalid toast type', () => {
        mockToast.invalid = undefined;
        const content = 'Test';

        expect(() => adapter.show(content, { type: 'invalid' as any })).toThrow('Invalid toast type invalid');
      });
    });

    describe('update', () => {
      it('should update existing toast with loading type', () => {
        const content = 'Updated content';
        adapter.update('sonner-1', content);

        expect(mockToast.loading).toHaveBeenCalledWith(content, {
          id: 'sonner-1',
          duration: Infinity,
        });
      });

      it('should update with success type', () => {
        const content = React.createElement('p', null, 'Success!');
        adapter.update('sonner-2', content, { type: 'success', duration: 4000 });

        expect(mockToast.success).toHaveBeenCalledWith(content, {
          id: 'sonner-2',
          duration: 4000,
        });
      });

      it('should update with error type', () => {
        const content = 'Error message';
        adapter.update(123, content, { type: 'error', duration: 6000 });

        expect(mockToast.error).toHaveBeenCalledWith(content, {
          id: 123,
          duration: 6000,
        });
      });

      it('should throw error for invalid toast type on update', () => {
        mockToast.warning = undefined;
        const content = 'Test';

        expect(() => adapter.update('id', content, { type: 'warning' as any })).toThrow('Invalid toast type warning');
      });
    });

    describe('dismiss', () => {
      it('should dismiss toast by string id', () => {
        adapter.dismiss('sonner-1');
        expect(mockToast.dismiss).toHaveBeenCalledWith('sonner-1');
      });

      it('should dismiss toast by number id', () => {
        adapter.dismiss(123);
        expect(mockToast.dismiss).toHaveBeenCalledWith(123);
      });
    });
  });

  describe('ReactToastifyAdapter', () => {
    let mockToast: any;
    let adapter: ReactToastifyAdapter;

    beforeEach(() => {
      mockToast = vi.fn().mockReturnValue('toastify-1');
      mockToast.update = vi.fn();
      mockToast.dismiss = vi.fn();
      mockToast.TYPE = {
        DEFAULT: 'default',
        SUCCESS: 'success',
        ERROR: 'error',
      };

      adapter = new ReactToastifyAdapter(mockToast);
    });

    describe('show', () => {
      it('should show loading toast with autoClose false', () => {
        const content = 'Loading...';
        const id = adapter.show(content);

        expect(mockToast).toHaveBeenCalledWith(content, {
          autoClose: false,
          isLoading: true,
          type: 'info',
          closeOnClick: false,
        });
        expect(id).toBe('toastify-1');
      });

      it('should show success toast with duration', () => {
        const content = React.createElement('div', null, 'Success!');
        const id = adapter.show(content, { type: 'success', duration: 3000 });

        expect(mockToast).toHaveBeenCalledWith(content, {
          autoClose: 3000,
          type: 'success',
          closeOnClick: false,
          isLoading: false,
        });
        expect(id).toBe('toastify-1');
      });

      it('should show error toast', () => {
        const content = 'Error!';
        const id = adapter.show(content, { type: 'error', duration: 5000 });

        expect(mockToast).toHaveBeenCalledWith(content, {
          autoClose: 5000,
          type: 'error',
          closeOnClick: false,
          isLoading: false,
        });
      });

      it('should handle Infinity duration as false autoClose', () => {
        const content = 'Test';
        adapter.show(content, { type: 'success', duration: Infinity });

        expect(mockToast).toHaveBeenCalledWith(content, {
          autoClose: false,
          type: 'success',
          closeOnClick: false,
          isLoading: false,
        });
      });

    });

    describe('update', () => {
      it('should update loading toast', () => {
        const content = 'Still loading...';
        adapter.update('toastify-1', content);

        expect(mockToast.update).toHaveBeenCalledWith('toastify-1', {
          render: content,
          autoClose: false,
          isLoading: true,
          type: 'info',
          closeOnClick: false,
        });
      });

      it('should update to success with duration', () => {
        const content = 'Complete!';
        adapter.update('toastify-1', content, { type: 'success', duration: 4000 });

        expect(mockToast.update).toHaveBeenCalledWith('toastify-1', {
          render: content,
          autoClose: 4000,
          type: 'success',
          isLoading: false,
          closeOnClick: false,
        });
      });

      it('should update to error', () => {
        const content = React.createElement('p', null, 'Failed');
        adapter.update(456, content, { type: 'error', duration: 6000 });

        expect(mockToast.update).toHaveBeenCalledWith(456, {
          render: content,
          autoClose: 6000,
          type: 'error',
          isLoading: false,
          closeOnClick: false,
        });
      });

      it('should handle Infinity duration in update', () => {
        const content = 'Loading forever';
        adapter.update('id', content, { type: 'loading', duration: Infinity });

        expect(mockToast.update).toHaveBeenCalledWith('id', {
          render: content,
          autoClose: false,
          isLoading: true,
          type: 'info',
          closeOnClick: false,
        });
      });
    });

    describe('dismiss', () => {
      it('should dismiss toast by string id', () => {
        adapter.dismiss('toastify-1');
        expect(mockToast.dismiss).toHaveBeenCalledWith('toastify-1');
      });

      it('should dismiss toast by number id', () => {
        adapter.dismiss(789);
        expect(mockToast.dismiss).toHaveBeenCalledWith(789);
      });
    });
  });

  describe('ReactHotToastAdapter', () => {
    let mockToast: any;
    let adapter: ReactHotToastAdapter;

    beforeEach(() => {
      mockToast = vi.fn().mockReturnValue('hot-toast-1');
      mockToast.loading = vi.fn().mockReturnValue('hot-toast-loading');
      mockToast.success = vi.fn().mockReturnValue('hot-toast-success');
      mockToast.error = vi.fn().mockReturnValue('hot-toast-error');
      mockToast.dismiss = vi.fn();

      adapter = new ReactHotToastAdapter(mockToast);
    });

    describe('show', () => {
      it('should show loading toast', () => {
        const content = 'Loading...';
        const id = adapter.show(content);

        expect(mockToast.loading).toHaveBeenCalledWith(content, {
          duration: Infinity,
        });
        expect(id).toBe('hot-toast-loading');
      });

      it('should show success toast with duration', () => {
        const content = 'Success!';
        const id = adapter.show(content, { type: 'success', duration: 3000 });

        expect(mockToast.success).toHaveBeenCalledWith(content, {
          duration: 3000,
        });
        expect(id).toBe('hot-toast-success');
      });

    });

    describe('update', () => {
      it('should update to success', () => {
        const content = 'Done!';
        adapter.update('hot-toast-1', content, { type: 'success', duration: 4000 });

        expect(mockToast.success).toHaveBeenCalledWith(content, {
          id: 'hot-toast-1',
          duration: 4000,
        });
      });

      it('should update to error', () => {
        const content = 'Failed!';
        adapter.update(123, content, { type: 'error', duration: 6000 });

        expect(mockToast.error).toHaveBeenCalledWith(content, {
          id: '123',
          duration: 6000,
        });
      });

      it('should handle string content with appropriate toast method', () => {
        const content = 'Simple string';
        adapter.update('id', content, { type: 'error', duration: 5000 });

        expect(mockToast.error).toHaveBeenCalledWith(content, {
          id: 'id',
          duration: 5000,
        });
      });
    });

    describe('dismiss', () => {
      it('should dismiss toast by string id', () => {
        adapter.dismiss('hot-toast-1');
        expect(mockToast.dismiss).toHaveBeenCalledWith('hot-toast-1');
      });

      it('should dismiss toast by number id', () => {
        adapter.dismiss(456);
        expect(mockToast.dismiss).toHaveBeenCalledWith(456);
      });
    });
  });

  describe('Adapter Interface Compliance', () => {
    it('should ensure all adapters implement ToastAdapter interface', () => {
      const mockSonnerToast: any = {
        loading: vi.fn(),
        success: vi.fn(),
        error: vi.fn(),
        dismiss: vi.fn(),
      };

      const mockToastifyToast: any = vi.fn();
      mockToastifyToast.update = vi.fn();
      mockToastifyToast.dismiss = vi.fn();

      const mockHotToast: any = vi.fn();
      mockHotToast.loading = vi.fn();
      mockHotToast.success = vi.fn();
      mockHotToast.error = vi.fn();
      mockHotToast.dismiss = vi.fn();

      const sonnerAdapter = new SonnerAdapter(mockSonnerToast);
      const toastifyAdapter = new ReactToastifyAdapter(mockToastifyToast);
      const hotToastAdapter = new ReactHotToastAdapter(mockHotToast);

      // Check that all adapters have the required methods
      const adapters = [sonnerAdapter, toastifyAdapter, hotToastAdapter];
      adapters.forEach((adapter) => {
        expect(typeof adapter.show).toBe('function');
        expect(typeof adapter.update).toBe('function');
        expect(typeof adapter.dismiss).toBe('function');
      });
    });
  });
});
