import { GenericContractApi } from 'dedot/contracts';
import { ISubstrateClient } from 'dedot';
import { BalanceInsufficientError } from '../utils/index.js';

/**
 * Checks whether the specified account has a sufficient free balance.
 * Throws a `BalanceInsufficientError` if the free balance is not enough to perform transaction.
 *
 * @param client
 * @param address
 */
export const checkBalanceSufficiency = async <T extends GenericContractApi = GenericContractApi>(
  client: ISubstrateClient<T['types']['ChainApi']>,
  address: string,
): Promise<void> => {
  const balance = await client.query.system.account(address);
  // TODO better calculate reducible balance
  if (balance.data.free <= 0n) {
    throw new BalanceInsufficientError(address);
  }
};
