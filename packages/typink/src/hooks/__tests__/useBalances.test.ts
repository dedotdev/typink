import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBalances } from '../useBalances.js';
import { useTypink } from '../useTypink.js';

// Mock the useTypink hook
vi.mock('../useTypink', () => ({
  useTypink: vi.fn(),
}));

describe('useBalances', () => {
  const mockAddresses = ['address1', 'address2'];
  const mockClient = {
    query: {
      system: {
        account: {
          multi: vi.fn(),
        },
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return an empty object when client is not available', async () => {
    (useTypink as ReturnType<typeof vi.fn>).mockReturnValue({ client: null });

    const { result } = renderHook(() => useBalances(mockAddresses));

    // Wait for the next update
    await act(async () => {});

    expect(result.current).toEqual({});
  });

  it('should fetch and return balances for given addresses', async () => {
    const mockBalances = [
      { data: { free: 100n, reserved: 10n, frozen: 5n } },
      { data: { free: 200n, reserved: 20n, frozen: 10n } },
    ];

    (useTypink as ReturnType<typeof vi.fn>).mockReturnValue({ client: mockClient });
    mockClient.query.system.account.multi.mockImplementation((addresses, callback) => {
      callback(mockBalances);
    });

    const { result } = renderHook(() => useBalances(mockAddresses));

    // Wait for the next update
    await act(async () => {});

    expect(result.current).toEqual({
      address1: { free: 100n, reserved: 10n, frozen: 5n },
      address2: { free: 200n, reserved: 20n, frozen: 10n },
    });
  });

  it('should update balances when addresses change', async () => {
    const initialBalances = [
      { data: { free: 100n, reserved: 10n, frozen: 5n } },
      { data: { free: 200n, reserved: 20n, frozen: 10n } },
    ];

    const updatedBalances = [
      { data: { free: 300n, reserved: 30n, frozen: 15n } },
      { data: { free: 400n, reserved: 40n, frozen: 20n } },
      { data: { free: 500n, reserved: 50n, frozen: 25n } },
    ];

    (useTypink as ReturnType<typeof vi.fn>).mockReturnValue({ client: mockClient });
    mockClient.query.system.account.multi
      .mockImplementationOnce((addresses, callback) => {
        callback(initialBalances);
      })
      .mockImplementationOnce((addresses, callback) => {
        callback(updatedBalances);
      });

    const { result, rerender } = renderHook((props) => useBalances(props), {
      initialProps: mockAddresses,
    });

    // Wait for the initial update
    await act(async () => {});

    expect(result.current).toEqual({
      address1: { free: 100n, reserved: 10n, frozen: 5n },
      address2: { free: 200n, reserved: 20n, frozen: 10n },
    });

    // Update addresses
    rerender(['address1', 'address2', 'address3']);

    // Wait for the next update
    await act(async () => {});

    expect(result.current).toEqual({
      address1: { free: 300n, reserved: 30n, frozen: 15n },
      address2: { free: 400n, reserved: 40n, frozen: 20n },
      address3: { free: 500n, reserved: 50n, frozen: 25n },
    });
  });
});
