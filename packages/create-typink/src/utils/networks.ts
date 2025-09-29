import { stringCamelCase } from '@dedot/utils';
import { ContractType, PALLET_CONTRACTS_NETWORKS, PALLET_REVIVE_NETWORKS, NetworkConfig } from '../types.js';

export interface NetworkTemplateConfig {
  supportedNetworks: string;
  defaultNetworkId: string;
  deploymentEntries: string;
}

export function getNetworkConfig(contractType: ContractType, selectedNetworks: string[]): NetworkTemplateConfig {
  const availableNetworks = contractType === ContractType.InkV5 ? PALLET_CONTRACTS_NETWORKS : PALLET_REVIVE_NETWORKS;
  const selectedNetworkConfigs = availableNetworks.filter((network) =>
    selectedNetworks.map((one) => stringCamelCase(one)).includes(network.value),
  );

  if (selectedNetworkConfigs.length === 0) {
    throw new Error('No valid networks selected');
  }

  const supportedNetworks = selectedNetworkConfigs.map((network) => network.value).join(', ');
  const defaultNetworkId = `${selectedNetworkConfigs[0].value}.id`;
  const deploymentEntries = generateDeploymentEntries(selectedNetworkConfigs, contractType);

  return {
    supportedNetworks,
    defaultNetworkId,
    deploymentEntries,
  };
}

const CONTRACT_IDS = {
  [ContractType.InkV5]: 'greeter',
  [ContractType.InkV6]: 'flipper',
  [ContractType.InkV6Sol]: 'flipper',
  [ContractType.Sol]: 'storage',
};

function generateDeploymentEntries(networkConfigs: NetworkConfig[], contractType: ContractType): string {
  const contractName = CONTRACT_IDS[contractType];

  return networkConfigs
    .map(
      (network) =>
        `{
          id: ContractId.${contractName.toUpperCase()},
          metadata: ${contractName},
          network: ${network.value}.id,
          address: '${network.contractAddresses[contractType]}',
        }`,
    )
    .join(',\n');
}
