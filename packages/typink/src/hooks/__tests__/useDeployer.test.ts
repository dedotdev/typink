import { renderHook } from '@testing-library/react';
import { useTypink } from '../useTypink.js';
import { ContractDeployer, ContractMetadata } from 'dedot/contracts';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { waitForNextUpdate } from './test-utils.js';
import { useDeployer } from '../useDeployer.js';

vi.mock('../useTypink', () => ({
  useTypink: vi.fn(),
}));

vi.mock('dedot/contracts', () => ({
  ContractDeployer: vi.fn(),
}));

describe('useDeployer', () => {
  const client = {} as any;
  const dummyDeployment = {
    id: 'test-contract',
    network: 'test-network',
    metadata: {},
    address: 'test-address',
  };
  const connectedAccount = { address: 'selected-account-address' };
  const defaultCaller = 'default-caller-address';
  const metadata = { source: { wasm: 'test-wasm' } } as ContractMetadata;

  const mockedUseTypink = {
    deployments: [dummyDeployment],
    client,
    // @ts-ignore
    networkId: 'test-network',
    connectedAccount,
    defaultCaller,
  };

  beforeEach(() => {
    vi.mocked(useTypink).mockReturnValue(mockedUseTypink as any);
    vi.mocked(ContractDeployer).mockImplementation(() => ({}) as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize deployer when all required parameters are present', async () => {
    const { result } = renderHook(() => useDeployer(metadata, 'test-wasm'));

    expect(result.current.deployer).toBeDefined();
    expect(ContractDeployer).toHaveBeenCalledTimes(1);
    expect(ContractDeployer).toHaveBeenCalledWith(
      client,
      metadata,
      'test-wasm',
      expect.objectContaining({
        defaultCaller: 'selected-account-address',
      }),
    );
  });

  it('should not initialize deployer when client is missing', () => {
    vi.mocked(useTypink).mockReturnValue({
      ...mockedUseTypink,
      client: undefined,
    } as any);

    const { result } = renderHook(() => useDeployer(metadata, 'test-wasm'));

    expect(result.current.deployer).toBeUndefined();
    expect(ContractDeployer).not.toHaveBeenCalled();
  });

  it('should reinitialize deployer when connectedAccount changes', async () => {
    const { result, rerender } = renderHook(() => useDeployer(metadata, 'test-wasm'));

    await waitForNextUpdate();

    expect(result.current.deployer).toBeDefined();
    expect(ContractDeployer).toHaveBeenCalledTimes(1);

    const newSelectedAccount = { address: 'new-selected-account-address' };
    vi.mocked(useTypink).mockReturnValue({
      ...vi.mocked(useTypink).mock.results[0].value,
      connectedAccount: newSelectedAccount,
    });

    await waitForNextUpdate(async () => {
      rerender();
    });

    expect(ContractDeployer).toHaveBeenCalledTimes(2);
    expect(ContractDeployer).toHaveBeenLastCalledWith(
      client,
      metadata,
      'test-wasm',
      expect.objectContaining({
        defaultCaller: 'new-selected-account-address',
      }),
    );
  });

  it('should use defaultCaller when connectedAccount is not available', async () => {
    vi.mocked(useTypink).mockReturnValue({
      ...mockedUseTypink,
      connectedAccount: undefined,
    } as any);

    const { result } = renderHook(() => useDeployer(metadata, 'test-wasm'));

    await waitForNextUpdate();

    expect(result.current.deployer).toBeDefined();
    expect(ContractDeployer).toHaveBeenCalledTimes(1);
    expect(ContractDeployer).toHaveBeenCalledWith(
      client,
      metadata,
      'test-wasm',
      expect.objectContaining({
        defaultCaller: 'default-caller-address',
      }),
    );
  });
});
