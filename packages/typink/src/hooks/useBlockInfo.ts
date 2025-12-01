import { useEffect, useState } from 'react';
import { NetworkOptions } from '../types.js';
import { useDeepDeps } from './internal/index.js';
import { usePolkadotClient } from './usePolkadotClient.js';
import { DedotClient } from 'dedot';

export interface BlockInfo {
  number: number;
  hash: string;
}

export interface UseBlockInfo {
  best?: BlockInfo;
  finalized?: BlockInfo;
}

type UnsubscribeFn = () => void;

const subscribeWithChainHead = async (
  client: DedotClient,
  setBestBlock: (block: BlockInfo) => void,
  setFinalizedBlock: (block: BlockInfo) => void,
): Promise<UnsubscribeFn> => {
  const unsubBest = client.block.best((block) => {
    setBestBlock({ number: block.number, hash: block.hash });
  });

  const unsubFinalized = client.block.finalized((block) => {
    setFinalizedBlock({ number: block.number, hash: block.hash });
  });

  return () => {
    try {
      unsubBest?.();
      unsubFinalized?.();
    } catch (error) {
      console.error('Error unsubscribing from chainHead:', error);
    }
  };
};

/**
 * A React hook that subscribes to best and finalized block updates in real time.
 *
 * ## Usage Patterns
 *
 * **Basic Usage**: Real-time block tracking for UI updates
 * ```typescript
 * const { best, finalized } = useBlockInfo();
 * // Initially: { best: undefined, finalized: undefined }
 * // After connection: { best: { number: 1000, hash: "0x..." }, finalized: { number: 998, hash: "0x..." } }
 * ```
 *
 * **Multi-Network**: Track blocks for specific networks
 * ```typescript
 * const polkadotBlocks = useBlockInfo({ networkId: 'polkadot' });
 * const kusamaBlocks = useBlockInfo({ networkId: 'kusama' });
 * ```
 *
 * @param options - Optional network selection options. If not provided, uses the default/primary network
 * @param options.networkId - Specific network ID to track blocks for
 * @returns Object containing current best and finalized block information
 * @returns returns.best - Latest best block information (undefined until first block received)
 * @returns returns.finalized - Latest finalized block information (undefined until first block received)
 */
export function useBlockInfo(options?: NetworkOptions): UseBlockInfo {
  const { client, network } = usePolkadotClient(options?.networkId);
  const [bestBlock, setBestBlock] = useState<BlockInfo>();
  const [finalizedBlock, setFinalizedBlock] = useState<BlockInfo>();

  useEffect(
    () => {
      if (!client) {
        setBestBlock(undefined);
        setFinalizedBlock(undefined);
        return;
      }

      let done = false;
      let unsubscribe: UnsubscribeFn | undefined;

      const setupSubscriptions = async () => {
        try {
          unsubscribe = await subscribeWithChainHead(client, setBestBlock, setFinalizedBlock);

          return unsubscribe;
        } catch (error) {
          console.error('Failed to setup block subscriptions:', error);
          throw error;
        }
      };

      setupSubscriptions()
        .then((unsub) => {
          if (done) {
            unsub();
          }
        })
        .catch((error) => {
          console.error('Setup subscriptions failed:', error);
        });

      return () => {
        done = true;
        unsubscribe?.();
      };
    },
    useDeepDeps([client, network.jsonRpcApi]),
  );

  return {
    best: bestBlock, // --
    finalized: finalizedBlock,
  };
}
