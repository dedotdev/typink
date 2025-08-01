// Generated by dedot cli

import type { GenericSubstrateApi } from 'dedot/types';
import type { Hash, Result } from 'dedot/codecs';
import type {
  GenericContractQuery,
  GenericContractQueryCall,
  ContractCallOptions,
  GenericContractCallResult,
  ContractCallResult,
} from 'dedot/contracts';
import type { FlipperFlipperError, InkPrimitivesLangError } from './types.js';

export interface ContractQuery<ChainApi extends GenericSubstrateApi> extends GenericContractQuery<ChainApi> {
  /**
   * Flips the current value, value based on seed.
   *
   * @param {Hash} seed
   * @param {ContractCallOptions} options
   *
   * @selector 0x847d0968
   **/
  flipWithSeed: GenericContractQueryCall<
    ChainApi,
    (
      seed: Hash,
      options?: ContractCallOptions,
    ) => Promise<GenericContractCallResult<Result<boolean, FlipperFlipperError>, ContractCallResult<ChainApi>>>
  >;

  /**
   * Flips the current value of the Flipper's boolean.
   *
   * @param {ContractCallOptions} options
   *
   * @selector 0x633aa551
   **/
  flip: GenericContractQueryCall<
    ChainApi,
    (options?: ContractCallOptions) => Promise<GenericContractCallResult<[], ContractCallResult<ChainApi>>>
  >;

  /**
   * Returns the current value of the Flipper's boolean.
   *
   * @param {ContractCallOptions} options
   *
   * @selector 0x2f865bd9
   **/
  get: GenericContractQueryCall<
    ChainApi,
    (options?: ContractCallOptions) => Promise<GenericContractCallResult<boolean, ContractCallResult<ChainApi>>>
  >;
}
