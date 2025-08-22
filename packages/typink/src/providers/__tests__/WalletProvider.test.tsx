import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import React from 'react';
import { useWallet, WalletContextProps, WalletProvider } from '../WalletProvider.js';
import { InjectedSigner, TypinkAccount } from '../../types.js';

describe('WalletProvider', () => {
  const mockSigner = (): InjectedSigner => ({
    signRaw: vi.fn().mockResolvedValue({
      id: 1,
      signature: '0xmocksignature',
    }),
    signPayload: vi.fn().mockResolvedValue({
      id: 1,
      signature: '0xmockpayload',
    }),
  });

  const mockAccount = (address: string, source: string, name?: string): TypinkAccount => ({
    address,
    source,
    name,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Context Provision', () => {
    it('should provide empty context by default', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => <WalletProvider>{children}</WalletProvider>;

      const { result } = renderHook(() => useWallet(), { wrapper });

      expect(result.current.signer).toBeUndefined();
      expect(result.current.connectedAccount).toBeUndefined();
    });

    it('should provide signer when passed as prop', () => {
      const testSigner = mockSigner();

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <WalletProvider signer={testSigner}>{children}</WalletProvider>
      );

      const { result } = renderHook(() => useWallet(), { wrapper });

      expect(result.current.signer).toBe(testSigner);
      expect(result.current.connectedAccount).toBeUndefined();
    });

    it('should provide connected account when passed as prop', () => {
      const testAccount = mockAccount('5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY', 'polkadot-js', 'Alice');

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <WalletProvider connectedAccount={testAccount}>{children}</WalletProvider>
      );

      const { result } = renderHook(() => useWallet(), { wrapper });

      expect(result.current.signer).toBeUndefined();
      expect(result.current.connectedAccount).toBe(testAccount);
    });

    it('should provide both signer and connected account when both are passed', () => {
      const testSigner = mockSigner();
      const testAccount = mockAccount('5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY', 'polkadot-js', 'Alice');

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <WalletProvider signer={testSigner} connectedAccount={testAccount}>
          {children}
        </WalletProvider>
      );

      const { result } = renderHook(() => useWallet(), { wrapper });

      expect(result.current.signer).toBe(testSigner);
      expect(result.current.connectedAccount).toBe(testAccount);
    });
  });

  describe('Context Updates', () => {
    it('should update context when signer prop changes', () => {
      const initialSigner = mockSigner();
      const updatedSigner = mockSigner();

      let currentSigner = initialSigner;

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <WalletProvider signer={currentSigner}>{children}</WalletProvider>
      );

      const { result, rerender } = renderHook(() => useWallet(), { wrapper });

      expect(result.current.signer).toBe(initialSigner);

      // Update the signer
      currentSigner = updatedSigner;
      rerender();

      expect(result.current.signer).toBe(updatedSigner);
    });

    it('should update context when connected account prop changes', () => {
      const initialAccount = mockAccount('5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY', 'polkadot-js', 'Alice');
      const updatedAccount = mockAccount('5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty', 'subwallet', 'Bob');

      let currentAccount = initialAccount;

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <WalletProvider connectedAccount={currentAccount}>{children}</WalletProvider>
      );

      const { result, rerender } = renderHook(() => useWallet(), { wrapper });

      expect(result.current.connectedAccount).toBe(initialAccount);

      // Update the account
      currentAccount = updatedAccount;
      rerender();

      expect(result.current.connectedAccount).toBe(updatedAccount);
    });

    it('should handle setting signer to undefined', () => {
      const testSigner = mockSigner();

      let currentSigner: InjectedSigner | undefined = testSigner;

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <WalletProvider signer={currentSigner}>{children}</WalletProvider>
      );

      const { result, rerender } = renderHook(() => useWallet(), { wrapper });

      expect(result.current.signer).toBe(testSigner);

      // Set signer to undefined
      currentSigner = undefined;
      rerender();

      expect(result.current.signer).toBeUndefined();
    });

    it('should handle setting connected account to undefined', () => {
      const testAccount = mockAccount('5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY', 'polkadot-js', 'Alice');

      let currentAccount: TypinkAccount | undefined = testAccount;

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <WalletProvider connectedAccount={currentAccount}>{children}</WalletProvider>
      );

      const { result, rerender } = renderHook(() => useWallet(), { wrapper });

      expect(result.current.connectedAccount).toBe(testAccount);

      // Set account to undefined
      currentAccount = undefined;
      rerender();

      expect(result.current.connectedAccount).toBeUndefined();
    });
  });

  describe('Children Rendering', () => {
    it('should render single child component', () => {
      const TestComponent = () => <div data-testid='test-child'>Test Child</div>;

      const wrapper = ({ children }: { children: React.ReactNode }) => <WalletProvider>{children}</WalletProvider>;

      const { result } = renderHook(() => useWallet(), {
        wrapper: ({ children }) =>
          wrapper({
            children: (
              <>
                <TestComponent />
                {children}
              </>
            ),
          }),
      });

      // Context should still be available
      expect(result.current).toBeDefined();
    });

    it('should render multiple child components', () => {
      const TestComponent1 = () => <div data-testid='test-child-1'>Test Child 1</div>;
      const TestComponent2 = () => <div data-testid='test-child-2'>Test Child 2</div>;

      const wrapper = ({ children }: { children: React.ReactNode }) => <WalletProvider>{children}</WalletProvider>;

      const { result } = renderHook(() => useWallet(), {
        wrapper: ({ children }) =>
          wrapper({
            children: (
              <>
                <TestComponent1 />
                <TestComponent2 />
                {children}
              </>
            ),
          }),
      });

      // Context should still be available
      expect(result.current).toBeDefined();
    });

    it('should render nested providers correctly', () => {
      const testSigner = mockSigner();
      const testAccount = mockAccount('5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY', 'polkadot-js', 'Alice');

      const OuterWrapper = ({ children }: { children: React.ReactNode }) => (
        <WalletProvider signer={testSigner}>{children}</WalletProvider>
      );

      const InnerWrapper = ({ children }: { children: React.ReactNode }) => (
        <WalletProvider connectedAccount={testAccount}>{children}</WalletProvider>
      );

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <OuterWrapper>
          <InnerWrapper>{children}</InnerWrapper>
        </OuterWrapper>
      );

      const { result } = renderHook(() => useWallet(), { wrapper });

      // Inner provider should override outer provider
      expect(result.current.signer).toBeUndefined(); // Inner provider doesn't provide signer
      expect(result.current.connectedAccount).toBe(testAccount); // Inner provider provides account
    });
  });

  describe('Context Consumption', () => {
    it('should allow multiple components to consume the same context', () => {
      const testSigner = mockSigner();
      const testAccount = mockAccount('5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY', 'polkadot-js', 'Alice');

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <WalletProvider signer={testSigner} connectedAccount={testAccount}>
          {children}
        </WalletProvider>
      );

      const { result: result1 } = renderHook(() => useWallet(), { wrapper });
      const { result: result2 } = renderHook(() => useWallet(), { wrapper });

      // Both hooks should return the same context values
      expect(result1.current.signer).toBe(testSigner);
      expect(result1.current.connectedAccount).toBe(testAccount);
      expect(result2.current.signer).toBe(testSigner);
      expect(result2.current.connectedAccount).toBe(testAccount);
    });

    it('should provide context type safety', () => {
      const testSigner = mockSigner();

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <WalletProvider signer={testSigner}>{children}</WalletProvider>
      );

      const { result } = renderHook(() => useWallet(), { wrapper });

      // Type checks - these should not cause TypeScript errors
      const context: WalletContextProps = result.current;
      expect(context).toBeDefined();

      // Verify the returned context matches expected interface
      expect(typeof result.current).toBe('object');
      expect('signer' in result.current).toBe(true);
      expect('connectedAccount' in result.current).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null children gracefully', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <WalletProvider>
          {null}
          {children}
        </WalletProvider>
      );

      const { result } = renderHook(() => useWallet(), { wrapper });

      expect(result.current.signer).toBeUndefined();
      expect(result.current.connectedAccount).toBeUndefined();
    });

    it('should handle empty fragment children', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <WalletProvider>
          {<></>}
          {children}
        </WalletProvider>
      );

      const { result } = renderHook(() => useWallet(), { wrapper });

      expect(result.current.signer).toBeUndefined();
      expect(result.current.connectedAccount).toBeUndefined();
    });

    it('should maintain stable context reference when props do not change', () => {
      const testSigner = mockSigner();
      const testAccount = mockAccount('5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY', 'polkadot-js', 'Alice');

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <WalletProvider signer={testSigner} connectedAccount={testAccount}>
          {children}
        </WalletProvider>
      );

      const { result, rerender } = renderHook(() => useWallet(), { wrapper });

      const initialContext = result.current;

      // Rerender without changing props
      rerender();

      const afterRerender = result.current;

      // Context values should be the same
      expect(afterRerender.signer).toBe(initialContext.signer);
      expect(afterRerender.connectedAccount).toBe(initialContext.connectedAccount);
    });
  });
});
