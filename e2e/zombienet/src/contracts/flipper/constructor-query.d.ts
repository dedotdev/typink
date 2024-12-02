// Generated by dedot cli

import type { GenericSubstrateApi } from 'dedot/types';
import type { Result, Hash } from 'dedot/codecs';
import type {
  GenericConstructorQuery,
  GenericConstructorQueryCall,
  GenericConstructorCallResult,
  ConstructorCallOptions,
  ContractInstantiateResult,
} from 'dedot/contracts';
import type { InkPrimitivesLangError, FlipperFlipperError } from './types';

export interface ConstructorQuery<ChainApi extends GenericSubstrateApi> extends GenericConstructorQuery<ChainApi> {
  /**
   * Creates a new flipper smart contract initialized with the given value.
   *
   * @param {boolean} initValue
   * @param {ConstructorCallOptions} options
   *
   * @selector 0x9bae9d5e
   **/
  new: GenericConstructorQueryCall<
    ChainApi,
    (
      initValue: boolean,
      options?: ConstructorCallOptions,
    ) => Promise<GenericConstructorCallResult<[], ContractInstantiateResult<ChainApi>>>
  >;

  /**
   * Creates a new flipper smart contract initialized to `false`.
   *
   * @param {ConstructorCallOptions} options
   *
   * @selector 0x61ef7e3e
   **/
  newDefault: GenericConstructorQueryCall<
    ChainApi,
    (options?: ConstructorCallOptions) => Promise<GenericConstructorCallResult<[], ContractInstantiateResult<ChainApi>>>
  >;

  /**
   * Creates a new flipper smart contract with the value being calculate using provided seed.
   *
   * @param {Hash} seed
   * @param {ConstructorCallOptions} options
   *
   * @selector 0x6d4cae81
   **/
  fromSeed: GenericConstructorQueryCall<
    ChainApi,
    (
      seed: Hash,
      options?: ConstructorCallOptions,
    ) => Promise<GenericConstructorCallResult<Result<[], FlipperFlipperError>, ContractInstantiateResult<ChainApi>>>
  >;
}
