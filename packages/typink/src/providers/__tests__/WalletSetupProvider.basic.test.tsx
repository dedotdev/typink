import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import React from 'react';
import { createStore, Provider as JotaiProvider } from 'jotai';
import { useWalletSetup, WalletSetupContext, WalletSetupProvider } from '../WalletSetupProvider.js';

// Simple test to verify the provider basic functionality
describe('WalletSetupProvider Basic Tests', () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
    vi.clearAllMocks();
  });

  describe('Provider Setup', () => {
    it('should be importable', () => {
      expect(WalletSetupProvider).toBeDefined();
      expect(useWalletSetup).toBeDefined();
      expect(WalletSetupContext).toBeDefined();
    });

    it('should export useWalletSetup hook', () => {
      expect(typeof useWalletSetup).toBe('function');
    });

    it('should export WalletSetupProvider component', () => {
      expect(typeof WalletSetupProvider).toBe('function');
    });
  });

  describe('Context Creation', () => {
    it('should create WalletSetupContext', () => {
      expect(WalletSetupContext).toBeDefined();
    });

    it('should have default context values', () => {
      // @ts-ignore
      expect(WalletSetupContext._currentValue || WalletSetupContext.defaultValue).toBeDefined();
    });
  });

  describe('Provider Rendering', () => {
    it('should render without crashing', () => {
      const TestComponent = () => <div>Test</div>;

      expect(() =>
        renderHook(() => null, {
          wrapper: ({ children }) => (
            <JotaiProvider store={store}>
              <WalletSetupProvider>
                <TestComponent />
                {children}
              </WalletSetupProvider>
            </JotaiProvider>
          ),
        }),
      ).not.toThrow();
    });

    it('should accept props without throwing', () => {
      const TestComponent = () => <div>Test</div>;

      expect(() =>
        renderHook(() => null, {
          wrapper: ({ children }) => (
            <JotaiProvider store={store}>
              <WalletSetupProvider appName='Test App' wallets={[]}>
                <TestComponent />
                {children}
              </WalletSetupProvider>
            </JotaiProvider>
          ),
        }),
      ).not.toThrow();
    });
  });
});
