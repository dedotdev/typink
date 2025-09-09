import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { ISubmittableResult } from 'dedot/types';
import { ToastAdapter } from '../types.js';

// Import the module to get access to internal state
let txToasterModule: typeof import('../index.js');

vi.mock('../../hooks/index.js', () => ({
  useTypink: vi.fn().mockReturnValue({
    network: { id: 'polkadot' },
    networks: [{ id: 'polkadot' }],
  }),
}));

describe('txToaster', () => {
  let mockAdapter: ToastAdapter;
  let toastId: string;
  let txToaster: typeof import('../index.js').txToaster;
  let setupTxToaster: typeof import('../index.js').setupTxToaster;

  beforeEach(async () => {
    // Fresh import to reset global state
    vi.resetModules();
    txToasterModule = await import('../index.js');
    txToaster = txToasterModule.txToaster;
    setupTxToaster = txToasterModule.setupTxToaster;

    toastId = 'toast-123';
    mockAdapter = {
      show: vi.fn().mockReturnValue(toastId),
      update: vi.fn(),
      dismiss: vi.fn(),
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('setupTxToaster', () => {
    it('should configure global adapter and settings', () => {
      const config = {
        adapter: mockAdapter,
        initialMessage: 'Custom signing message',
        autoCloseDelay: 3000,
      };

      setupTxToaster(config);

      // Test that the global config is used
      const toaster = txToaster();
      expect(mockAdapter.show).toHaveBeenCalledWith('Custom signing message', {
        type: 'loading',
        duration: Infinity,
      });
    });

    it('should allow partial config updates', () => {
      setupTxToaster({
        adapter: mockAdapter,
      });

      const toaster = txToaster({ initialMessage: 'Transaction starting...' });
      expect(mockAdapter.show).toHaveBeenCalledWith('Transaction starting...', {
        type: 'loading',
        duration: Infinity,
      });
    });
  });

  describe('txToaster creation', () => {
    beforeEach(() => {
      setupTxToaster({ adapter: mockAdapter });
    });

    it('should throw error when no adapter is configured', () => {
      // Clear global adapter
      setupTxToaster({ adapter: null as any });

      expect(() => txToaster()).toThrow('No toast adapter configured');
    });

    it('should accept string as initial message', () => {
      const toaster = txToaster('Processing transaction...');

      expect(mockAdapter.show).toHaveBeenCalledWith('Processing transaction...', {
        type: 'loading',
        duration: Infinity,
      });
      expect(toaster).toHaveProperty('onTxProgress');
      expect(toaster).toHaveProperty('onTxError');
    });

    it('should accept configuration object', () => {
      const localAdapter: ToastAdapter = {
        show: vi.fn().mockReturnValue('local-toast'),
        update: vi.fn(),
        dismiss: vi.fn(),
      };

      const toaster = txToaster({
        initialMessage: 'Local message',
        adapter: localAdapter,
        networkId: 'polkadot',
        autoCloseDelay: 7000,
      });

      expect(localAdapter.show).toHaveBeenCalledWith('Local message', {
        type: 'loading',
        duration: Infinity,
      });
    });

    it('should use default values when not specified', () => {
      setupTxToaster({ adapter: mockAdapter }); // Reset to defaults
      const toaster = txToaster();

      expect(mockAdapter.show).toHaveBeenCalledWith('Signing Transaction...', {
        type: 'loading',
        duration: Infinity,
      });
    });

    it('should prefer local adapter over global adapter', () => {
      const localAdapter: ToastAdapter = {
        show: vi.fn().mockReturnValue('local-toast'),
        update: vi.fn(),
        dismiss: vi.fn(),
      };

      txToaster({ adapter: localAdapter });

      expect(localAdapter.show).toHaveBeenCalled();
      expect(mockAdapter.show).not.toHaveBeenCalled();
    });
  });

  describe('onTxProgress', () => {
    let toaster: ReturnType<typeof txToaster>;

    beforeEach(() => {
      setupTxToaster({ adapter: mockAdapter, autoCloseDelay: 5000 });
      toaster = txToaster();
    });

    it('should update toast with "Transaction In Progress" for in-progress status', () => {
      const progress: ISubmittableResult = {
        status: { type: 'Ready' },
        dispatchError: undefined,
      } as any;

      toaster.onTxProgress(progress);

      expect(mockAdapter.update).toHaveBeenCalledWith(toastId, expect.anything(), {
        type: 'loading',
        duration: Infinity,
      });

      // Check the React element passed
      // @ts-ignore
      const updateCall = mockAdapter.update.mock.calls[0];
      const reactElement = updateCall[1];
      expect(React.isValidElement(reactElement)).toBe(true);
    });

    it('should update toast with success when Finalized without error', () => {
      const progress: ISubmittableResult = {
        status: {
          type: 'Finalized',
          value: {
            blockNumber: 12345,
            blockHash: '0xabc',
            txIndex: 0,
          },
        },
        dispatchError: undefined,
      } as any;

      toaster.onTxProgress(progress);

      expect(mockAdapter.update).toHaveBeenCalledWith(toastId, expect.anything(), {
        type: 'success',
        duration: 5000,
      });
    });

    it('should update toast with error when Finalized with dispatchError', () => {
      const progress: ISubmittableResult = {
        status: {
          type: 'Finalized',
          value: {
            blockNumber: 12345,
            blockHash: '0xabc',
            txIndex: 0,
          },
        },
        dispatchError: { type: 'Module' } as any,
      } as any;

      toaster.onTxProgress(progress);

      expect(mockAdapter.update).toHaveBeenCalledWith(toastId, expect.anything(), {
        type: 'error',
        duration: 5000,
      });
    });

    it('should update toast with error when status is Invalid', () => {
      const progress: ISubmittableResult = {
        status: {
          type: 'Invalid',
          value: { error: 'Invalid transaction' },
        },
        dispatchError: undefined,
      } as any;

      toaster.onTxProgress(progress);

      expect(mockAdapter.update).toHaveBeenCalledWith(toastId, expect.anything(), {
        type: 'error',
        duration: 5000,
      });
    });

    it('should update toast with error when status is Drop', () => {
      const progress: ISubmittableResult = {
        status: {
          type: 'Drop',
          value: { error: 'Transaction dropped' },
        },
        dispatchError: undefined,
      } as any;

      toaster.onTxProgress(progress);

      expect(mockAdapter.update).toHaveBeenCalledWith(toastId, expect.anything(), {
        type: 'error',
        duration: 5000,
      });
    });

    it('should pass networkId to TxProgress component', () => {
      const toasterWithNetwork = txToaster({ networkId: 'kusama' });

      const progress: ISubmittableResult = {
        status: { type: 'Ready' },
        dispatchError: undefined,
      } as any;

      toasterWithNetwork.onTxProgress(progress);

      // @ts-ignore
      const updateCall = mockAdapter.update.mock.calls[0];
      const reactElement = updateCall[1] as React.ReactElement;

      expect(reactElement.props.networkId).toBe('kusama');
    });

    it('should use custom autoCloseDelay', () => {
      const toasterWithDelay = txToaster({ autoCloseDelay: 10000 });

      const progress: ISubmittableResult = {
        status: {
          type: 'Finalized',
          value: {
            blockNumber: 12345,
            blockHash: '0xabc',
            txIndex: 0,
          },
        },
        dispatchError: undefined,
      } as any;

      toasterWithDelay.onTxProgress(progress);

      expect(mockAdapter.update).toHaveBeenCalledWith(toastId, expect.anything(), {
        type: 'success',
        duration: 10000,
      });
    });
  });

  describe('onTxError', () => {
    let toaster: ReturnType<typeof txToaster>;

    beforeEach(() => {
      setupTxToaster({ adapter: mockAdapter, autoCloseDelay: 5000 });
      toaster = txToaster();
    });

    it('should update toast with error message', () => {
      const error = new Error('Transaction failed');

      toaster.onTxError(error);

      expect(mockAdapter.update).toHaveBeenCalledWith(toastId, expect.anything(), {
        type: 'error',
        duration: 5000,
      });

      // @ts-ignore Check the React element passed
      const updateCall = mockAdapter.update.mock.calls[0];
      const reactElement = updateCall[1] as React.ReactElement;
      expect(React.isValidElement(reactElement)).toBe(true);
      expect(reactElement.type).toBe('p');
      expect(reactElement.props.children).toBe('Transaction failed');
    });

    it('should use custom autoCloseDelay for errors', () => {
      const toasterWithDelay = txToaster({ autoCloseDelay: 8000 });
      const error = new Error('Custom error');

      toasterWithDelay.onTxError(error);

      expect(mockAdapter.update).toHaveBeenCalledWith(toastId, expect.anything(), {
        type: 'error',
        duration: 8000,
      });
    });
  });

  describe('multiple toaster instances', () => {
    beforeEach(() => {
      setupTxToaster({ adapter: mockAdapter, autoCloseDelay: 5000 });
    });

    it('should create independent toast instances', () => {
      mockAdapter.show = vi.fn().mockReturnValueOnce('toast-1').mockReturnValueOnce('toast-2');

      const toaster1 = txToaster('First transaction');
      const toaster2 = txToaster('Second transaction');

      expect(mockAdapter.show).toHaveBeenCalledTimes(2);
      expect(mockAdapter.show).toHaveBeenNthCalledWith(1, 'First transaction', expect.any(Object));
      expect(mockAdapter.show).toHaveBeenNthCalledWith(2, 'Second transaction', expect.any(Object));

      // Update first toaster
      const progress1: ISubmittableResult = {
        status: { type: 'Ready' },
        dispatchError: undefined,
      } as any;
      toaster1.onTxProgress(progress1);

      // Update second toaster
      const progress2: ISubmittableResult = {
        status: {
          type: 'Finalized',
          value: {
            blockNumber: 12345,
            blockHash: '0xabc',
            txIndex: 0,
          },
        },
        dispatchError: undefined,
      } as any;
      toaster2.onTxProgress(progress2);

      // Check that different toast IDs were updated
      expect(mockAdapter.update).toHaveBeenCalledTimes(2);
      // @ts-ignore
      const firstUpdateCall = mockAdapter.update.mock.calls[0];
      // @ts-ignore
      const secondUpdateCall = mockAdapter.update.mock.calls[1];

      expect(firstUpdateCall[0]).toBe('toast-1');
      expect(secondUpdateCall[0]).toBe('toast-2');
      expect(firstUpdateCall[2].type).toBe('loading');
      expect(secondUpdateCall[2].type).toBe('success');
    });
  });
});
