import { NetworkInfo } from '../types.js';

export const development: NetworkInfo = {
  id: 'development',
  name: 'Development',
  logo: `https://avatars.githubusercontent.com/u/47530779?s=200&v=4`,
  providers: ['ws://127.0.0.1:9944'],
  symbol: 'UNIT',
  decimals: 12,
};
