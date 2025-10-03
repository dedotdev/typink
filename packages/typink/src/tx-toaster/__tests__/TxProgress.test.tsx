import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import React from 'react';
import { TxProgress } from '../TxProgress.js';
import { useTypink } from '../../hooks/index.js';
import { TxStatus } from 'dedot/types';

// Mock the useTypink hook
vi.mock('../../hooks/index.js', () => ({
  useTypink: vi.fn(),
}));

describe('TxProgress', () => {
  const mockNetwork = {
    id: 'polkadot',
    name: 'Polkadot',
    subscanUrl: 'https://polkadot.subscan.io',
    pjsUrl: 'https://polkadot.js.org/apps/?rpc=wss%3A%2F%2Frpc.polkadot.io',
  };

  const mockNetworkKusama = {
    id: 'kusama',
    name: 'Kusama',
    subscanUrl: 'https://kusama.subscan.io',
    pjsUrl: null,
  };

  const mockNetworkNoExplorer = {
    id: 'local',
    name: 'Local',
    subscanUrl: null,
    pjsUrl: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useTypink as any).mockReturnValue({
      network: mockNetwork,
      networks: [mockNetwork, mockNetworkKusama, mockNetworkNoExplorer],
    });
  });

  afterEach(() => {
    cleanup();
  });

  describe('message display', () => {
    it('should display the provided message', () => {
      const progress = {
        status: { type: 'Ready' } as any,
        txHash: '0x1234567890abcdef',
        dispatchError: undefined,
      } as any;

      render(<TxProgress message="Transaction is processing" progress={progress} />);

      expect(screen.getByText('Transaction is processing')).toBeTruthy();
    });
  });

  describe('status display', () => {
    it('should display Ready status', () => {
      const progress = {
        status: { type: 'Ready' } as any,
        txHash: '0x1234567890abcdef',
        dispatchError: undefined,
      } as any;

      render(<TxProgress message="Test" progress={progress} />);

      expect(screen.getByText('Ready')).toBeTruthy();
    });

    it('should display BestChainBlockIncluded status with block info', () => {
      const progress = {
        status: {
          type: 'BestChainBlockIncluded',
          value: {
            blockNumber: 12345,
            blockHash: '0xabc',
            txIndex: 3,
          },
        } as any,
        txHash: '0x1234567890abcdef',
        dispatchError: undefined,
      } as any;

      render(<TxProgress message="Test" progress={progress} />);

      expect(screen.getByText('BestChainBlockIncluded (#12345 / 3)')).toBeTruthy();
    });

    it('should display Finalized status with block info', () => {
      const progress = {
        status: {
          type: 'Finalized',
          value: {
            blockNumber: 67890,
            blockHash: '0xdef',
            txIndex: 5,
          },
        } as any,
        txHash: '0xabcdef1234567890',
        dispatchError: undefined,
      } as any;

      render(<TxProgress message="Test" progress={progress} />);

      expect(screen.getByText('Finalized (#67890 / 5)')).toBeTruthy();
    });

    it('should display Invalid status with error', () => {
      const progress = {
        status: {
          type: 'Invalid',
          value: {
            error: 'Invalid nonce',
          },
        } as any,
        txHash: undefined,
        dispatchError: undefined,
      } as any;

      render(<TxProgress message="Test" progress={progress} />);

      expect(screen.getByText('Invalid (Invalid nonce)')).toBeTruthy();
    });

    it('should display Drop status with error', () => {
      const progress = {
        status: {
          type: 'Drop',
          value: {
            error: 'Transaction dropped from pool',
          },
        } as any,
        txHash: undefined,
        dispatchError: undefined,
      } as any;

      render(<TxProgress message="Test" progress={progress} />);

      expect(screen.getByText('Drop (Transaction dropped from pool)')).toBeTruthy();
    });

    it('should display status without extra info for other types', () => {
      const progress = {
        status: { type: 'Broadcast' } as any,
        txHash: '0x1234567890abcdef',
        dispatchError: undefined,
      } as any;

      render(<TxProgress message="Test" progress={progress} />);

      expect(screen.getByText('Broadcast')).toBeTruthy();
    });
  });

  describe('explorer links', () => {
    it('should show Subscan link when transaction is included and subscanUrl exists', () => {
      const progress = {
        status: {
          type: 'BestChainBlockIncluded',
          value: {
            blockNumber: 12345,
            blockHash: '0xabc',
            txIndex: 3,
          },
        } as any,
        txHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        dispatchError: undefined,
      } as any;

      render(<TxProgress message="Test" progress={progress} />);

      const link = screen.getByText('👉 View transaction on Subscan');
      expect(link).toBeTruthy();
      expect(link.getAttribute('href')).toBe('https://polkadot.subscan.io/extrinsic/0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef');
      expect(link.getAttribute('target')).toBe('_blank');
      expect(link.getAttribute('rel')).toBe('noreferrer');
    });

    it('should show Subscan link when transaction is finalized', () => {
      const progress = {
        status: {
          type: 'Finalized',
          value: {
            blockNumber: 67890,
            blockHash: '0xdef',
            txIndex: 5,
          },
        } as any,
        txHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        dispatchError: undefined,
      } as any;

      render(<TxProgress message="Test" progress={progress} />);

      const link = screen.getByText('👉 View transaction on Subscan');
      expect(link).toBeTruthy();
      expect(link.getAttribute('href')).toBe('https://polkadot.subscan.io/extrinsic/0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890');
    });

    it('should show Polkadot.js link when subscanUrl is not available but pjsUrl is', () => {
      (useTypink as any).mockReturnValue({
        network: { ...mockNetwork, subscanUrl: null },
        networks: [{ ...mockNetwork, subscanUrl: null }],
      });

      const progress = {
        status: {
          type: 'Finalized',
          value: {
            blockNumber: 12345,
            blockHash: '0xabcdef',
            txIndex: 3,
          },
        } as any,
        txHash: '0x1234567890abcdef',
        dispatchError: undefined,
      } as any;

      render(<TxProgress message="Test" progress={progress} />);

      const link = screen.getByText('👉 View transaction on Polkadot.js');
      expect(link).toBeTruthy();
      expect(link.getAttribute('href')).toBe(
        'https://polkadot.js.org/apps/?rpc=wss%3A%2F%2Frpc.polkadot.io#/explorer/query/0xabcdef'
      );
    });

    it('should not show explorer link when neither subscanUrl nor pjsUrl is available', () => {
      (useTypink as any).mockReturnValue({
        network: mockNetworkNoExplorer,
        networks: [mockNetworkNoExplorer],
      });

      const progress = {
        status: {
          type: 'Finalized',
          value: {
            blockNumber: 12345,
            blockHash: '0xabc',
            txIndex: 3,
          },
        } as any,
        txHash: '0x1234567890abcdef',
        dispatchError: undefined,
      } as any;

      render(<TxProgress message="Test" progress={progress} />);

      expect(screen.queryByText(/View transaction on/)).toBeNull();
    });

    it('should not show explorer link for non-included/finalized status', () => {
      const progress = {
        status: { type: 'Ready' } as any,
        txHash: '0x1234567890abcdef',
        dispatchError: undefined,
      } as any;

      render(<TxProgress message="Test" progress={progress} />);

      expect(screen.queryByText(/View transaction on/)).toBeNull();
    });
  });

  describe('network selection', () => {
    it('should use current network when networkId is not provided', () => {
      const progress = {
        status: {
          type: 'Finalized',
          value: {
            blockNumber: 12345,
            blockHash: '0xabc',
            txIndex: 3,
          },
        } as any,
        txHash: '0x1234567890abcdef',
        dispatchError: undefined,
      } as any;

      render(<TxProgress message="Test" progress={progress} />);

      const link = screen.getByText('👉 View transaction on Subscan');
      expect(link.getAttribute('href')).toContain('polkadot.subscan.io');
    });

    it('should use specified network when networkId is provided', () => {
      const progress = {
        status: {
          type: 'Finalized',
          value: {
            blockNumber: 12345,
            blockHash: '0xabc',
            txIndex: 3,
          },
        } as any,
        txHash: '0x1234567890abcdef',
        dispatchError: undefined,
      } as any;

      render(<TxProgress message="Test" progress={progress} networkId="kusama" />);

      const link = screen.getByText('👉 View transaction on Subscan');
      expect(link.getAttribute('href')).toContain('kusama.subscan.io');
    });

    it('should fallback to current network if networkId is not found', () => {
      const progress = {
        status: {
          type: 'Finalized',
          value: {
            blockNumber: 12345,
            blockHash: '0xabc',
            txIndex: 3,
          },
        } as any,
        txHash: '0x1234567890abcdef',
        dispatchError: undefined,
      } as any;

      render(<TxProgress message="Test" progress={progress} networkId="unknown" />);

      const link = screen.getByText('👉 View transaction on Subscan');
      expect(link.getAttribute('href')).toContain('polkadot.subscan.io');
    });
  });

  describe('component structure', () => {
    it('should render with correct structure and styles', () => {
      const progress = {
        status: {
          type: 'Finalized',
          value: {
            blockNumber: 12345,
            blockHash: '0xabc',
            txIndex: 3,
          },
        } as any,
        txHash: '0x1234567890abcdef',
        dispatchError: undefined,
      } as any;

      const { container } = render(<TxProgress message="Success" progress={progress} />);

      const mainDiv = container.firstChild as HTMLElement;
      expect(mainDiv.tagName).toBe('DIV');
      expect(mainDiv.className).toBe('typink-tx-toaster');

      const paragraphs = mainDiv.querySelectorAll('p');
      expect(paragraphs).toHaveLength(3); // message, status, explorer link

      // Check CSS classes
      expect(paragraphs[0].className).toBe('typink-tx-toaster-message');
      expect(paragraphs[1].className).toBe('typink-tx-toaster-status');
      expect(paragraphs[2].className).toBe('typink-tx-toaster-explorer');

      // Check styles
      expect(paragraphs[0].style.fontSize).toBe('1em');
      expect(paragraphs[1].style.fontSize).toBe('0.85em');
      expect(paragraphs[1].style.color).toBe('rgb(102, 102, 102)'); // #666 is converted to rgb
      expect(paragraphs[2].style.fontSize).toBe('0.85em');
      expect(paragraphs[2].style.marginTop).toBe('0.5rem');

      const link = paragraphs[2].querySelector('a');
      expect(link?.className).toBe('typink-tx-toaster-explorer-link');
      expect(link?.style.textDecoration).toBe('underline');
      expect(link?.style.color).toBe('rgb(102, 102, 102)'); // #666 is converted to rgb
    });

    it('should render without explorer link paragraph when no explorer available', () => {
      (useTypink as any).mockReturnValue({
        network: mockNetworkNoExplorer,
        networks: [mockNetworkNoExplorer],
      });

      const progress = {
        status: { type: 'Ready' } as any,
        txHash: '0x1234567890abcdef',
        dispatchError: undefined,
      } as any;

      const { container } = render(<TxProgress message="Processing" progress={progress} />);

      const mainDiv = container.firstChild as HTMLElement;
      const paragraphs = mainDiv.querySelectorAll('p');
      expect(paragraphs).toHaveLength(2); // message and status only
    });
  });
});