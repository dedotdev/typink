import { stringCamelCase } from '@dedot/utils';
import { ContractType, PALLET_CONTRACTS_NETWORKS, PALLET_REVIVE_NETWORKS, NetworkConfig } from '../types.js';

export interface NetworkTemplateConfig {
  supportedNetworks: string;
  defaultNetworkId: string;
  deploymentEntries: string;
}

export function getNetworkConfig(contractType: ContractType, selectedNetworks: string[]): NetworkTemplateConfig {
  const availableNetworks = contractType === ContractType.InkV6 ? PALLET_REVIVE_NETWORKS : PALLET_CONTRACTS_NETWORKS;
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

function generateDeploymentEntries(networkConfigs: NetworkConfig[], contractType: ContractType): string {
  const contractName = contractType === ContractType.InkV6 ? 'flipper' : 'greeter';
  const metadataName = contractType === ContractType.InkV6 ? 'flipperMetadata' : 'greeterMetadata';

  const deploymentEntries = networkConfigs
    .map(
      (network) =>
        `{
          id: ContractId.${contractName.toUpperCase()},
          metadata: ${metadataName},
          network: ${network.value}.id,
          address: '${network.address}',
        }`,
    )
    .join(',\n');

  return deploymentEntries;
}
