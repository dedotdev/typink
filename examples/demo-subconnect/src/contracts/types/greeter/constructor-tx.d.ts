// Generated by dedot cli

import type { GenericSubstrateApi } from 'dedot/types';
import type {
  GenericConstructorTx,
  GenericConstructorTxCall,
  ConstructorTxOptions,
  GenericInstantiateSubmittableExtrinsic,
} from 'dedot/contracts';

export interface ConstructorTx<ChainApi extends GenericSubstrateApi> extends GenericConstructorTx<ChainApi> {
  /**
   * Creates a new greeter contract initialized with the given value.
   *
   * @param {string} initValue
   * @param {ConstructorTxOptions} options
   *
   * @selector 0x9bae9d5e
   **/
  new: GenericConstructorTxCall<
    ChainApi,
    (initValue: string, options: ConstructorTxOptions) => GenericInstantiateSubmittableExtrinsic<ChainApi>
  >;

  /**
   * Creates a new greeter contract initialized to 'Hello ink!'.
   *
   * @param {ConstructorTxOptions} options
   *
   * @selector 0xed4b9d1b
   **/
  default: GenericConstructorTxCall<
    ChainApi,
    (options: ConstructorTxOptions) => GenericInstantiateSubmittableExtrinsic<ChainApi>
  >;
}