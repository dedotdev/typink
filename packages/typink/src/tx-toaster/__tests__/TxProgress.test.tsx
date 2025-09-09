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
      const status: TxStatus = { type: 'Ready' } as any;
      
      render(<TxProgress message="Transaction is processing" status={status} />);
      
      expect(screen.getByText('Transaction is processing')).toBeTruthy();
    });
  });

  describe('status display', () => {
    it('should display Ready status', () => {
      const status: TxStatus = { type: 'Ready' } as any;
      
      render(<TxProgress message="Test" status={status} />);
      
      expect(screen.getByText('Ready')).toBeTruthy();
    });

    it('should display BestChainBlockIncluded status with block info', () => {
      const status: TxStatus = {
        type: 'BestChainBlockIncluded',
        value: {
          blockNumber: 12345,
          blockHash: '0xabc',
          txIndex: 3,
        },
      } as any;
      
      render(<TxProgress message="Test" status={status} />);
      
      expect(screen.getByText('BestChainBlockIncluded (#12345 / 3)')).toBeTruthy();
    });

    it('should display Finalized status with block info', () => {
      const status: TxStatus = {
        type: 'Finalized',
        value: {
          blockNumber: 67890,
          blockHash: '0xdef',
          txIndex: 5,
        },
      } as any;
      
      render(<TxProgress message="Test" status={status} />);
      
      expect(screen.getByText('Finalized (#67890 / 5)')).toBeTruthy();
    });

    it('should display Invalid status with error', () => {
      const status: TxStatus = {
        type: 'Invalid',
        value: {
          error: 'Invalid nonce',
        },
      } as any;
      
      render(<TxProgress message="Test" status={status} />);
      
      expect(screen.getByText('Invalid (Invalid nonce)')).toBeTruthy();
    });

    it('should display Drop status with error', () => {
      const status: TxStatus = {
        type: 'Drop',
        value: {
          error: 'Transaction dropped from pool',
        },
      } as any;
      
      render(<TxProgress message="Test" status={status} />);
      
      expect(screen.getByText('Drop (Transaction dropped from pool)')).toBeTruthy();
    });

    it('should display status without extra info for other types', () => {
      const status: TxStatus = { type: 'Broadcast' } as any;
      
      render(<TxProgress message="Test" status={status} />);
      
      expect(screen.getByText('Broadcast')).toBeTruthy();
    });
  });

  describe('explorer links', () => {
    it('should show Subscan link when transaction is included and subscanUrl exists', () => {
      const status: TxStatus = {
        type: 'BestChainBlockIncluded',
        value: {
          blockNumber: 12345,
          blockHash: '0xabc',
          txIndex: 3,
        },
      } as any;
      
      render(<TxProgress message="Test" status={status} />);
      
      const link = screen.getByText('👉 View transaction on Subscan');
      expect(link).toBeTruthy();
      expect(link.getAttribute('href')).toBe('https://polkadot.subscan.io/extrinsic/12345-3');
      expect(link.getAttribute('target')).toBe('_blank');
      expect(link.getAttribute('rel')).toBe('noreferrer');
    });

    it('should show Subscan link when transaction is finalized', () => {
      const status: TxStatus = {
        type: 'Finalized',
        value: {
          blockNumber: 67890,
          blockHash: '0xdef',
          txIndex: 5,
        },
      } as any;
      
      render(<TxProgress message="Test" status={status} />);
      
      const link = screen.getByText('👉 View transaction on Subscan');
      expect(link).toBeTruthy();
      expect(link.getAttribute('href')).toBe('https://polkadot.subscan.io/extrinsic/67890-5');
    });

    it('should show Polkadot.js link when subscanUrl is not available but pjsUrl is', () => {
      (useTypink as any).mockReturnValue({
        network: { ...mockNetwork, subscanUrl: null },
        networks: [{ ...mockNetwork, subscanUrl: null }],
      });

      const status: TxStatus = {
        type: 'Finalized',
        value: {
          blockNumber: 12345,
          blockHash: '0xabcdef',
          txIndex: 3,
        },
      } as any;
      
      render(<TxProgress message="Test" status={status} />);
      
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

      const status: TxStatus = {
        type: 'Finalized',
        value: {
          blockNumber: 12345,
          blockHash: '0xabc',
          txIndex: 3,
        },
      } as any;
      
      render(<TxProgress message="Test" status={status} />);
      
      expect(screen.queryByText(/View transaction on/)).toBeNull();
    });

    it('should not show explorer link for non-included/finalized status', () => {
      const status: TxStatus = { type: 'Ready' } as any;
      
      render(<TxProgress message="Test" status={status} />);
      
      expect(screen.queryByText(/View transaction on/)).toBeNull();
    });
  });

  describe('network selection', () => {
    it('should use current network when networkId is not provided', () => {
      const status: TxStatus = {
        type: 'Finalized',
        value: {
          blockNumber: 12345,
          blockHash: '0xabc',
          txIndex: 3,
        },
      } as any;
      
      render(<TxProgress message="Test" status={status} />);
      
      const link = screen.getByText('👉 View transaction on Subscan');
      expect(link.getAttribute('href')).toContain('polkadot.subscan.io');
    });

    it('should use specified network when networkId is provided', () => {
      const status: TxStatus = {
        type: 'Finalized',
        value: {
          blockNumber: 12345,
          blockHash: '0xabc',
          txIndex: 3,
        },
      } as any;
      
      render(<TxProgress message="Test" status={status} networkId="kusama" />);
      
      const link = screen.getByText('👉 View transaction on Subscan');
      expect(link.getAttribute('href')).toContain('kusama.subscan.io');
    });

    it('should fallback to current network if networkId is not found', () => {
      const status: TxStatus = {
        type: 'Finalized',
        value: {
          blockNumber: 12345,
          blockHash: '0xabc',
          txIndex: 3,
        },
      } as any;
      
      render(<TxProgress message="Test" status={status} networkId="unknown" />);
      
      const link = screen.getByText('👉 View transaction on Subscan');
      expect(link.getAttribute('href')).toContain('polkadot.subscan.io');
    });
  });

  describe('component structure', () => {
    it('should render with correct structure and styles', () => {
      const status: TxStatus = {
        type: 'Finalized',
        value: {
          blockNumber: 12345,
          blockHash: '0xabc',
          txIndex: 3,
        },
      } as any;
      
      const { container } = render(<TxProgress message="Success" status={status} />);
      
      const mainDiv = container.firstChild as HTMLElement;
      expect(mainDiv.tagName).toBe('DIV');
      
      const paragraphs = mainDiv.querySelectorAll('p');
      expect(paragraphs).toHaveLength(3); // message, status, explorer link
      
      // Check styles
      expect(paragraphs[1].style.fontSize).toBe('12px');
      expect(paragraphs[2].style.fontSize).toBe('12px');
      expect(paragraphs[2].style.marginTop).toBe('0.5rem');
      
      const link = paragraphs[2].querySelector('a');
      expect(link?.style.textDecoration).toBe('underline');
    });

    it('should render without explorer link paragraph when no explorer available', () => {
      (useTypink as any).mockReturnValue({
        network: mockNetworkNoExplorer,
        networks: [mockNetworkNoExplorer],
      });

      const status: TxStatus = { type: 'Ready' } as any;
      
      const { container } = render(<TxProgress message="Processing" status={status} />);
      
      const mainDiv = container.firstChild as HTMLElement;
      const paragraphs = mainDiv.querySelectorAll('p');
      expect(paragraphs).toHaveLength(2); // message and status only
    });
  });
});