import { describe, expect, it, vi } from 'vitest';
import { extractHumanReadableError } from '../errors';
import { DedotError } from 'dedot/utils';
import {
  ContractDispatchError,
  ContractLangError,
  ContractInstantiateDispatchError,
  ContractInstantiateLangError,
} from 'dedot/contracts';

// Mock the ISubstrateClient
const mockClient = {
  registry: {
    findErrorMeta: vi.fn(),
  },
} as any;

// Mock the DedotError
class MockDedotError extends DedotError {
  constructor(message: string) {
    super(message);
  }
}

describe('extractHumanReadableError', () => {
  it('should return the error message for non-DedotError', () => {
    const error = new Error('Test error');
    expect(extractHumanReadableError(mockClient, error)).toBe('Test error');
  });

  describe('ContractDispatchError cases', () => {
    it('should handle CannotLookup dispatch error', () => {
      const error = new ContractDispatchError({ type: 'CannotLookup' }, {} as any);
      expect(extractHumanReadableError(mockClient, error)).toBe('Failed to lookup information (e.g: accounts, data)');
    });

    it('should handle Other dispatch error', () => {
      const error = new ContractDispatchError({ type: 'Other' }, {} as any);
      expect(extractHumanReadableError(mockClient, error)).toBe('An unexpected error occurred');
    });

    it('should handle BadOrigin dispatch error', () => {
      const error = new ContractDispatchError({ type: 'BadOrigin' }, {} as any);
      expect(extractHumanReadableError(mockClient, error)).toBe('Bad origin');
    });

    it('should handle Module dispatch error with custom message', () => {
      const error = new ContractDispatchError({ type: 'Module', value: {} as any } as any, {} as any);
      mockClient.registry.findErrorMeta.mockReturnValue({ docs: ['Custom module error', 'message'] });
      expect(extractHumanReadableError(mockClient, error)).toBe('Custom module error message');
    });

    it('should handle Module dispatch error without custom message', () => {
      const error = new ContractDispatchError({ type: 'Module', value: {} as any } as any, {} as any);
      mockClient.registry.findErrorMeta.mockReturnValue({ docs: [] });
      expect(extractHumanReadableError(mockClient, error)).toBe('Unknown Module Error');
    });

    it('should handle ConsumerRemaining dispatch error', () => {
      const error = new ContractDispatchError({ type: 'ConsumerRemaining' }, {} as any);
      expect(extractHumanReadableError(mockClient, error)).toBe(
        'At least one consumer is remaining so the account cannot be destroyed',
      );
    });

    it('should handle NoProviders dispatch error', () => {
      const error = new ContractDispatchError({ type: 'NoProviders' }, {} as any);
      expect(extractHumanReadableError(mockClient, error)).toBe(
        'There are no providers so the account cannot be created',
      );
    });

    it('should handle TooManyConsumers dispatch error', () => {
      const error = new ContractDispatchError({ type: 'TooManyConsumers' }, {} as any);
      expect(extractHumanReadableError(mockClient, error)).toBe(
        'There are too many consumers so the account cannot be created',
      );
    });

    it('should handle Token dispatch error', () => {
      const error = new ContractDispatchError({ type: 'Token', value: 'FundsUnavailable' }, {} as any);
      expect(extractHumanReadableError(mockClient, error)).toBe('Funds are unavailable');
    });

    it('should handle unknown Token dispatch error', () => {
      const error = new ContractDispatchError({ type: 'Token' } as any, {} as any);
      expect(extractHumanReadableError(mockClient, error)).toBe('Unknown Token-related Error');
    });

    it('should handle Arithmetic dispatch error', () => {
      const error = new ContractDispatchError({ type: 'Arithmetic', value: 'Overflow' }, {} as any);
      expect(extractHumanReadableError(mockClient, error)).toBe('Arithmetic Error: Overflow');
    });

    it('should handle unknown Arithmetic dispatch error', () => {
      const error = new ContractDispatchError({ type: 'Arithmetic' } as any, {} as any);
      expect(extractHumanReadableError(mockClient, error)).toBe('Unknown Arithmetic Error');
    });

    it('should handle Transactional dispatch error', () => {
      const error = new ContractDispatchError({ type: 'Transactional' } as any, {} as any);
      expect(extractHumanReadableError(mockClient, error)).toBe(
        'The number of transactional layers has been reached, or we are not in a transactional layer.',
      );
    });

    it('should handle Exhausted dispatch error', () => {
      const error = new ContractDispatchError({ type: 'Exhausted' }, {} as any);
      expect(extractHumanReadableError(mockClient, error)).toBe(
        'Resources exhausted, e.g. attempt to read/write data which is too large to manipulate.',
      );
    });

    it('should handle Corruption dispatch error', () => {
      const error = new ContractDispatchError({ type: 'Corruption' }, {} as any);
      expect(extractHumanReadableError(mockClient, error)).toBe(
        'The state is corrupt, this is generally not going to fix itself',
      );
    });

    it('should handle Unavailable dispatch error', () => {
      const error = new ContractDispatchError({ type: 'Unavailable' }, {} as any);
      expect(extractHumanReadableError(mockClient, error)).toBe(
        'Some resource (e.g. a preimage) is unavailable right now. This might fix itself later.',
      );
    });

    it('should handle RootNotAllowed dispatch error', () => {
      const error = new ContractDispatchError({ type: 'RootNotAllowed' }, {} as any);
      expect(extractHumanReadableError(mockClient, error)).toBe('Root origin is not allowed.');
    });
  });

  describe('ContractInstantiateDispatchError cases', () => {
    it('should handle ContractInstantiateDispatchError', () => {
      const error = new ContractInstantiateDispatchError({ type: 'CannotLookup' }, {} as any);
      expect(extractHumanReadableError(mockClient, error)).toBe('Failed to lookup information (e.g: accounts, data)');
    });
  });

  describe('LangError cases', () => {
    it('should handle ContractLangError', () => {
      const error = new ContractLangError('Lang error', {
        result: { isOk: true, value: { flags: { bits: 1 } } },
      } as any);
      expect(extractHumanReadableError(mockClient, error)).toBe(
        'Contract Language Error: Invalid message input or unavailable contract message.',
      );
    });

    it('should handle ContractInstantiateLangError', () => {
      const error = new ContractInstantiateLangError('Instantiate Lang error', {
        result: { isOk: true, value: { result: { flags: { bits: 1 } } } },
      } as any);
      expect(extractHumanReadableError(mockClient, error)).toBe(
        'Contract Language Error: Invalid message input or unavailable contract message.',
      );
    });
  });

  it('should return original message for unhandled DedotError', () => {
    const error = new MockDedotError('Unhandled error');
    expect(extractHumanReadableError(mockClient, error)).toBe('Unhandled error');
  });
});
