import { describe, expect, it } from 'vitest';
import { genesisHashToCaipId, convertNetworkInfoToCaipId } from '../chains.js';
import { NetworkInfo, NetworkType } from '../../types.js';

describe('chains utilities', () => {
  describe('genesisHashToCaipId', () => {
    it('should convert genesis hash to CAIP-2 format', () => {
      const genesisHash = '0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3';
      const result = genesisHashToCaipId(genesisHash);

      expect(result).toBe('polkadot:91b171bb158e2d3848fa23a9f1c25182');
    });

    it('should remove 0x prefix and take first 32 characters', () => {
      const genesisHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
      const result = genesisHashToCaipId(genesisHash);

      expect(result).toBe('polkadot:abcdef1234567890abcdef1234567890');
      expect(result.split(':')[1]).toHaveLength(32);
    });

    it('should handle genesis hash without 0x prefix', () => {
      const genesisHash = '91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3';
      const result = genesisHashToCaipId(genesisHash);

      expect(result).toBe('polkadot:91b171bb158e2d3848fa23a9f1c25182');
    });

    it('should handle short genesis hash', () => {
      const genesisHash = '0xabcd1234';
      const result = genesisHashToCaipId(genesisHash);

      expect(result).toBe('polkadot:abcd1234');
    });
  });

  describe('convertNetworkInfoToCaipId', () => {
    it('should convert multiple networks to CAIP-2 identifiers', () => {
      const networks: NetworkInfo[] = [
        {
          id: 'polkadot',
          type: NetworkType.MAINNET,
          name: 'Polkadot',
          logo: 'polkadot.png',
          providers: ['wss://rpc.polkadot.io'],
          symbol: 'DOT',
          decimals: 10,
          genesisHash: '0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3',
        },
        {
          id: 'kusama',
          type: NetworkType.MAINNET,
          name: 'Kusama',
          logo: 'kusama.png',
          providers: ['wss://kusama-rpc.polkadot.io'],
          symbol: 'KSM',
          decimals: 12,
          genesisHash: '0xb0a8d493285c2df73290dfb7e61f870f17b41801197a149ca93654499ea3dafe',
        },
      ];

      const result = convertNetworkInfoToCaipId(networks);

      expect(result).toHaveLength(2);
      expect(result[0]).toBe('polkadot:91b171bb158e2d3848fa23a9f1c25182');
      expect(result[1]).toBe('polkadot:b0a8d493285c2df73290dfb7e61f870f');
    });

    it('should filter out networks without genesis hash', () => {
      const networks: NetworkInfo[] = [
        {
          id: 'polkadot',
          type: NetworkType.MAINNET,
          name: 'Polkadot',
          logo: 'polkadot.png',
          providers: ['wss://rpc.polkadot.io'],
          symbol: 'DOT',
          decimals: 10,
          genesisHash: '0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3',
        },
        {
          id: 'custom',
          name: 'Custom Network',
          logo: 'custom.png',
          providers: ['wss://custom.io'],
          symbol: 'CUST',
          decimals: 10,
          // No genesisHash
        },
      ];

      const result = convertNetworkInfoToCaipId(networks);

      expect(result).toHaveLength(1);
      expect(result[0]).toBe('polkadot:91b171bb158e2d3848fa23a9f1c25182');
    });

    it('should return empty array for networks without genesis hash', () => {
      const networks: NetworkInfo[] = [
        {
          id: 'custom',
          name: 'Custom Network',
          logo: 'custom.png',
          providers: ['wss://custom.io'],
          symbol: 'CUST',
          decimals: 10,
        },
      ];

      const result = convertNetworkInfoToCaipId(networks);

      expect(result).toHaveLength(0);
    });

    it('should return empty array for empty input', () => {
      const result = convertNetworkInfoToCaipId([]);

      expect(result).toHaveLength(0);
    });
  });
});
