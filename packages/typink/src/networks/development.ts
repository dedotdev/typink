import { NetworkInfo } from '../types.js';
import { NetworkId } from './id.js';

export const development: NetworkInfo = {
  id: NetworkId.DEVELOPMENT,
  name: 'Development',
  logo: `https://avatars.githubusercontent.com/u/47530779?s=200&v=4`,
  provider: 'ws://127.0.0.1:9944',
  prefix: 42,
  symbol: 'UNIT',
  decimals: 12,
};
