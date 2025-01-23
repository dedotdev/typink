import { useEffect, useState } from 'react';
import { useTypink } from 'typink';

interface BlockInfo {
  bestBlock?: number;
  finalizedBlock?: number;
}

export function useBlockInfo(): BlockInfo {
  const { client } = useTypink();

  const [bestBlock, setBestBlock] = useState<number>();
  const [finalizedBlock, setFinalizedBlock] = useState<number>();

  useEffect(() => {
    if (!client) {
      setBestBlock(undefined);
      setFinalizedBlock(undefined);
      return;
    }

    let unsub1: any, unsub2: any;
    let done = false;

    //   unsub1 = client.chainHead.on('bestBlock', (block: PinnedBlock) => {
    //     setBestBlock(block.number);
    //   });
    //
    //   unsub2 = client.chainHead.on('finalizedBlock', (block: PinnedBlock) => {
    //     setFinalizedBlock(block.number);
    //   });

    client.rpc
      .chain_subscribeNewHeads((newHead) => {
        setBestBlock(newHead.number);
      })
      .then((unsub) => {
        if (done) {
          unsub().catch(console.error);
        } else {
          unsub1 = unsub;
        }
      })
      .catch(console.error);

    client.rpc
      .chain_subscribeFinalizedHeads((newHead) => {
        setFinalizedBlock(newHead.number);
      })
      .then((unsub) => {
        if (done) {
          unsub().catch(console.error);
        } else {
          unsub2 = unsub;
        }
      })
      .catch(console.error);

    return () => {
      done = true;
      unsub1 && unsub1();
      unsub2 && unsub2();
    };
  }, [client]);

  return { bestBlock, finalizedBlock };
}
