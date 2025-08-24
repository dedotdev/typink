import { useEffect, useState } from 'react';
import { NetworkOptions, JsonRpcApi } from '../types.js';
import { Unsub } from 'dedot/types';
import { useDeepDeps } from './internal/index.js';
import { usePolkadotClient } from './usePolkadotClient.js';
import { DedotClient, LegacyClient, PinnedBlock } from 'dedot';

export interface BlockInfo {
  bestBlock?: number;
  finalizedBlock?: number;
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

const subscribeWithChainHead = (
  client: DedotClient,
  setBestBlock: (block: number) => void,
  setFinalizedBlock: (block: number) => void,
): UnsubscribeFn => {
  const unsubBest = client.chainHead.on('bestBlock', (block: PinnedBlock) => {
    setBestBlock(block.number);
  });

  const unsubFinalized = client.chainHead.on('finalizedBlock', (block: PinnedBlock) => {
    setFinalizedBlock(block.number);
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
  setBestBlock: (block: number) => void,
  setFinalizedBlock: (block: number) => void,
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

    // Subscribe to new heads (best blocks)
    client.rpc
      .chain_subscribeNewHeads((newHead: { number: number }) => {
        setBestBlock(newHead.number);
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
      .chain_subscribeFinalizedHeads((newHead: { number: number }) => {
        setFinalizedBlock(newHead.number);
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

export function useBlockInfo(options?: NetworkOptions): BlockInfo {
  const { client, network } = usePolkadotClient(options?.networkId);
  const [bestBlock, setBestBlock] = useState<number>();
  const [finalizedBlock, setFinalizedBlock] = useState<number>();

  useEffect(
    () => {
      if (!client) {
        setBestBlock(undefined);
        setFinalizedBlock(undefined);
        return;
      }

      const done = { current: false };
      let unsubscribe: UnsubscribeFn | undefined;

      const jsonRpcApi = network.jsonRpcApi || JsonRpcApi.NEW;

      const setupSubscriptions = async () => {
        try {
          if (jsonRpcApi === JsonRpcApi.NEW) {
            unsubscribe = subscribeWithChainHead(client as any, setBestBlock, setFinalizedBlock);
          } else {
            unsubscribe = await subscribeWithLegacyAPI(client as any, setBestBlock, setFinalizedBlock);
          }
        } catch (error) {
          console.error('Failed to setup block subscriptions:', error);
          throw error;
        }
      };

      setupSubscriptions().catch((error) => {
        console.error('Setup subscriptions failed:', error);
      });

      return () => {
        done.current = true;
        unsubscribe?.();
      };
    },
    useDeepDeps([client, network.jsonRpcApi]),
  );

  return { bestBlock, finalizedBlock };
}
