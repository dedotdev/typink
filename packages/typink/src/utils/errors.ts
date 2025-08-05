import { DedotError } from 'dedot/utils';
import {
  GenericContractApi,
  isContractDispatchError,
  isContractInstantiateDispatchError,
  isContractInstantiateLangError,
  isContractLangError,
} from '@dedot/contracts';
import { ISubstrateClient } from 'dedot';

/**
 * Typink-related errors
 */
export class TypinkError extends DedotError {}

/**
 * Represents an error that occurs during contract message execution.
 *
 * @typeparam T - The type of the error object, extends any.
 * @extends TypinkError
 */
export class ContractMessageError<T extends any> extends TypinkError {
  constructor(
    public error: T,
    message?: string,
  ) {
    super(message || `Contract Message Error: ${extractErrorType(error)}`);
  }
}

/**
 * Represents an error that occurs when the caller has insufficient balance to perform a transaction.
 *
 * @extends TypinkError
 */
export class BalanceInsufficientError extends TypinkError {
  constructor(
    public caller: string,
    message?: string,
  ) {
    super(message || 'Insufficient balance to perform this transaction');
  }
}

const extractErrorType = (error: any): string => {
  if (typeof error === 'object' && error?.hasOwnProperty('type')) {
    return error['type'];
  } else if (typeof error === 'string') {
    return error;
  }

  return JSON.stringify(error);
};

/**
 * Extract human-readable error message from an Error instance
 *
 * @param client
 * @param error
 */
export const extractHumanReadableError = <T extends GenericContractApi = GenericContractApi, E extends Error = any>(
  client: ISubstrateClient<T['types']['ChainApi']>,
  error: E,
): string => {
  if (!(error instanceof DedotError)) {
    return error.message;
  }

  // Ref: https://paritytech.github.io/polkadot-sdk/master/frame_support/pallet_prelude/enum.DispatchError.html#variants
  // DispatchError
  if (isContractDispatchError(error) || isContractInstantiateDispatchError(error)) {
    const dispatchError = error.dispatchError;
    switch (dispatchError.type) {
      case 'CannotLookup':
        return 'Failed to lookup information (e.g: accounts, data)';
      case 'Other':
        return 'An unexpected error occurred';
      case 'BadOrigin':
        return 'Bad origin';
      case 'Module':
        const moduleError = client.registry.findErrorMeta(dispatchError);
        if (moduleError) {
          const message = moduleError.docs.join(' ').trim();
          if (message) return message;
        }

        return 'Unknown Module Error';
      case 'ConsumerRemaining':
        return 'At least one consumer is remaining so the account cannot be destroyed';
      case 'NoProviders':
        return 'There are no providers so the account cannot be created';
      case 'TooManyConsumers':
        return 'There are too many consumers so the account cannot be created';
      case 'Token':
        switch (dispatchError.value) {
          case 'FundsUnavailable':
            return 'Funds are unavailable';
          case 'OnlyProvider':
            return 'Some part of the balance gives the only provider reference to the account and thus cannot be (re)moved';
          case 'BelowMinimum':
            return 'Account cannot exist with the funds that would be given.';
          case 'CannotCreate':
            return 'Account cannot be created';
          case 'UnknownAsset':
            return 'The asset in question is unknown';
          case 'Frozen':
            return 'Funds exist but are frozen';
          case 'Unsupported':
            return 'Operation is not supported by the asset.';
          case 'CannotCreateHold':
            return 'Account cannot be created for a held balance.';
          case 'NotExpendable':
            return 'Withdrawal would cause unwanted loss of account.';
          case 'Blocked':
            return 'Account cannot receive the assets.';
        }

        return 'Unknown Token-related Error';
      case 'Arithmetic':
        switch (dispatchError.value) {
          case 'Underflow':
            return 'Arithmetic Error: Underflow';
          case 'Overflow':
            return 'Arithmetic Error: Overflow';
          case 'DivisionByZero':
            return 'Arithmetic Error: Division by zero';
        }

        return 'Unknown Arithmetic Error';
      case 'Transactional':
        return 'The number of transactional layers has been reached, or we are not in a transactional layer.';
      case 'Exhausted':
        return 'Resources exhausted, e.g. attempt to read/write data which is too large to manipulate.';
      case 'Corruption':
        return 'The state is corrupt, this is generally not going to fix itself';
      case 'Unavailable':
        return 'Some resource (e.g. a preimage) is unavailable right now. This might fix itself later.';
      case 'RootNotAllowed':
        return 'Root origin is not allowed.';
    }
  }

  // LangError
  if (isContractLangError(error) || isContractInstantiateLangError(error)) {
    return 'Contract Language Error: Invalid message input or unavailable contract message.';
  }

  // ContractMessageError & BalanceInsufficientError & Other errors
  return error.message;
};

/**
 * Replace the message of an Error instance with a human-readable error message
 *
 * @param client
 * @param error
 */
export const withReadableErrorMessage = <T extends GenericContractApi = GenericContractApi, E extends Error = any>(
  client: ISubstrateClient<T['types']['ChainApi']>,
  error: E,
): Error => {
  error.message = extractHumanReadableError(client, error);

  return error;
};
