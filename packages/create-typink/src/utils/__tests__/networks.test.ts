import { describe, expect, it } from 'vitest';
import { getNetworkConfig } from '../networks.js';
import { InkVersion } from '../../types.js';

describe('networks', () => {
  describe('getNetworkConfig', () => {
    describe('deployment string generation', () => {
      it('should generate correct deployment structure for V6', () => {
        const result = getNetworkConfig(InkVersion.InkV6, ['Passet Hub']);

        expect(result.deploymentEntries).toMatch(/id: ContractId\.FLIPPER,/);
        expect(result.deploymentEntries).toMatch(/metadata: flipperMetadata as any,/);
        expect(result.deploymentEntries).toMatch(/network: passetHub\.id,/);
        expect(result.deploymentEntries).toMatch(/address: '0x87396fA7d7FcE9B3e4b11a733C98700968426c50',/);
      });

      it('should generate correct deployment structure for legacy', () => {
        const result = getNetworkConfig(InkVersion.InkLegacy, ['Aleph Zero']);

        expect(result.deploymentEntries).toMatch(/id: ContractId\.GREETER,/);
        expect(result.deploymentEntries).toMatch(/metadata: greeterMetadata,/);
        expect(result.deploymentEntries).toMatch(/network: alephZero\.id,/);
        expect(result.deploymentEntries).toMatch(/address: '5CYZtKBxuva33JREQkbeaE4ed2niWb1ijS4pgXbFD61yZti1',/);
      });

      it('should generate multiple deployment entries for multiple networks', () => {
        const result = getNetworkConfig(InkVersion.InkV6, ['Passet Hub', 'Kusama Asset Hub']);

        // Should contain both network entries
        const deploymentEntries = result.deploymentEntries.match(/{\s*id: ContractId\.FLIPPER,[\s\S]*?}/g);
        expect(deploymentEntries).toHaveLength(2);

        // Should be comma-separated
        expect(result.deploymentEntries).toMatch(/},\s*{\s*id: ContractId\.FLIPPER/);
      });
    });

    describe('error handling', () => {
      it('should throw error when no valid networks are selected for V6', () => {
        expect(() => {
          getNetworkConfig(InkVersion.InkV6, ['Invalid Network']);
        }).toThrow('No valid networks selected');
      });

      it('should throw error when no valid networks are selected for legacy', () => {
        expect(() => {
          getNetworkConfig(InkVersion.InkLegacy, ['Invalid Network']);
        }).toThrow('No valid networks selected');
      });

      it('should throw error when empty array is provided', () => {
        expect(() => {
          getNetworkConfig(InkVersion.InkV6, []);
        }).toThrow('No valid networks selected');
      });

      it('should throw error when mixing V6 and legacy network names', () => {
        expect(() => {
          getNetworkConfig(InkVersion.InkV6, ['Aleph Zero']); // Legacy network with V6 version
        }).toThrow('No valid networks selected');

        expect(() => {
          getNetworkConfig(InkVersion.InkLegacy, ['Passet Hub']); // V6 network with legacy version
        }).toThrow('No valid networks selected');
      });
    });

    describe('network name normalization', () => {
      it('should handle different case variations for V6 networks', () => {
        const result1 = getNetworkConfig(InkVersion.InkV6, ['passet hub']);
        const result2 = getNetworkConfig(InkVersion.InkV6, ['PASSET HUB']);
        const result3 = getNetworkConfig(InkVersion.InkV6, ['Passet Hub']);

        expect(result1.supportedNetworks).toBe('passetHub');
        expect(result2.supportedNetworks).toBe('passetHub');
        expect(result3.supportedNetworks).toBe('passetHub');
      });

      it('should handle different case variations for legacy networks', () => {
        const result1 = getNetworkConfig(InkVersion.InkLegacy, ['aleph zero']);
        const result2 = getNetworkConfig(InkVersion.InkLegacy, ['ALEPH ZERO']);
        const result3 = getNetworkConfig(InkVersion.InkLegacy, ['Aleph Zero']);

        expect(result1.supportedNetworks).toBe('alephZero');
        expect(result2.supportedNetworks).toBe('alephZero');
        expect(result3.supportedNetworks).toBe('alephZero');
      });
    });
  });
});
