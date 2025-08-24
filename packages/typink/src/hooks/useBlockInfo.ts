import { useEffect, useState } from 'react';
import { NetworkOptions, JsonRpcApi } from '../types.js';
import { Unsub } from 'dedot/types';
import { useDeepDeps } from './internal/index.js';
import { usePolkadotClient } from './usePolkadotClient.js';
import { DedotClient, LegacyClient, PinnedBlock } from 'dedot';
import { $Header, Header } from 'dedot/codecs';

export interface BlockInfo {
  number: number;
  hash: string;
}

export interface UseBlockInfo {
  best?: BlockInfo;
  finalized?: BlockInfo;
}

/**
 * A custom React hook that subscribes to block information including best block and finalized block numbers.
 *
 * This hook automatically detects and uses the appropriate API:
 * - For networks with JsonRpcApi.NEW: Uses chainHead event listeners ('bestBlock', 'finalizedBlock') for better efficiency
 * - For networks with JsonRpcApi.LEGACY: Falls back to legacy chain subscription methods (chain_subscribeNewHeads, chain_subscribeFinalizedHeads)
 *
 * @param options - Optional network selection options containing networkId
 * @returns BlockInfo object containing bestBlock and finalizedBlock numbers
 */
type UnsubscribeFn = () => void;

const subscribeWithChainHead = async (
  client: DedotClient,
  setBestBlock: (block: BlockInfo) => void,
  setFinalizedBlock: (block: BlockInfo) => void,
): Promise<UnsubscribeFn> => {
  const best = await client.chainHead.bestBlock();
  const finalized = await client.chainHead.finalizedBlock();

  setBestBlock({ number: best.number, hash: best.hash });
  setFinalizedBlock({ number: finalized.number, hash: finalized.hash });

  const unsubBest = client.chainHead.on('bestBlock', (block: PinnedBlock) => {
    setBestBlock({ number: block.number, hash: block.hash });
  });

  const unsubFinalized = client.chainHead.on('finalizedBlock', (block: PinnedBlock) => {
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

const subscribeWithLegacyAPI = (
  client: LegacyClient,
  setBestBlock: (block: BlockInfo) => void,
  setFinalizedBlock: (block: BlockInfo) => void,
): Promise<UnsubscribeFn> => {
  return new Promise((resolve) => {
    let unsubBest: Unsub | undefined;
    let unsubFinalized: Unsub | undefined;
    let subscriptionsCount = 0;
    const totalSubscriptions = 2;

    const checkComplete = () => {
      subscriptionsCount++;
      if (subscriptionsCount === totalSubscriptions) {
        resolve(() => {
          try {
            unsubBest?.().catch(console.error);
            unsubFinalized?.().catch(console.error);
          } catch (error) {
            console.error('Error unsubscribing from legacy API:', error);
          }
        });
      }
    };

    const calculateBlockHash = (header: Header): string => {
      return client.registry.hashAsHex($Header.tryEncode(header));
    };

    // Subscribe to new heads (best blocks)
    client.rpc
      .chain_subscribeNewHeads((header: Header) => {
        setBestBlock({ number: header.number, hash: calculateBlockHash(header) });
      })
      .then((unsub: Unsub) => {
        unsubBest = unsub;
        checkComplete();
      })
      .catch((error: Error) => {
        console.error('Failed to subscribe to new heads:', error);
        checkComplete();
      });

    // Subscribe to finalized heads
    client.rpc
      .chain_subscribeFinalizedHeads((header: Header) => {
        setFinalizedBlock({ number: header.number, hash: calculateBlockHash(header) });
      })
      .then((unsub: Unsub) => {
        unsubFinalized = unsub;
        checkComplete();
      })
      .catch((error: Error) => {
        console.error('Failed to subscribe to finalized heads:', error);
        checkComplete();
      });
  });
};

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

      const jsonRpcApi = network.jsonRpcApi || JsonRpcApi.NEW;

      const setupSubscriptions = async () => {
        try {
          if (jsonRpcApi === JsonRpcApi.NEW) {
            unsubscribe = await subscribeWithChainHead(client as any, setBestBlock, setFinalizedBlock);
          } else {
            unsubscribe = await subscribeWithLegacyAPI(client as any, setBestBlock, setFinalizedBlock);
          }

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
