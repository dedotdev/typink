import { DedotError } from 'dedot/utils';

/**
 * Typink-related errors
 */
export class TypinkError extends DedotError {}

export class ContractMessageError<T extends any> extends TypinkError {
    constructor(public error: T, message?: string) {
        super(message || `Contract Message Error: ${extractErrorType(error)}`);
    }
}

export class BalanceInsufficientError extends TypinkError {
    constructor(public caller: string, message?: string) {
        super(message || 'Insufficient balance to perform this transaction');
    }
}

const extractErrorType = (error: any): string => {
    if (typeof error === 'object' && error?.hasOwnProperty('type')) {
        return error['type'];
    } else if (typeof error === 'string') {
        return error;
    }

    return JSON.stringify(error)
}