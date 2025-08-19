"use client";

import PendingText from "@/components/pending-text";
import { Button } from "@/components/ui/button";
import { ContractId } from "@/contracts/deployments";
import { FlipperContractApi } from "@/contracts/types/flipper";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  useContract,
  useContractQuery,
  useContractTx,
} from "typink";

export default function FlipperBoard() {
  const { contract } = useContract<FlipperContractApi>(ContractId.FLIPPER);
  const flipTx = useContractTx(contract, "flip");
  const [mounted, setMounted] = useState(false);

  const { data: value, isLoading } = useContractQuery({
    contract,
    fn: "get",
    watch: true,
  });

  const handleFlip = async () => {
    if (!contract) return;

    toast.info("Signing transaction...", {
      description: "Please confirm in your wallet",
    });

    try {
      await flipTx.signAndSend({
        args: [],
        callback: (result) => {
          const { status } = result;
          console.log(status);

          if (status.type === "BestChainBlockIncluded") {
            toast.success("Value flipped successfully!", {
              description: `State changed to ${value ? "TRUE" : "FALSE"}`,
            });
          } else {
            toast.info(`Transaction ${status.type}`, {
              description: "Processing blockchain transaction...",
            });
          }
        },
      });
    } catch (e: any) {
      console.error(e, e.message);
      toast.error("Transaction failed", {
        description: e.message || "Please try again",
      });
    }
  };

  useEffect(() => {
    setMounted(true);
  }, [])

  if (!mounted) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">Flipper Contract</h1>
          <p className="text-muted-foreground">
            Simple boolean state flipper - toggle between TRUE and FALSE
          </p>
        </div>

        <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border rounded-xl p-8 shadow-lg space-y-8">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-lg p-6 min-h-[80px] flex items-center justify-center">
            <div className="flex items-center gap-3">
              <PendingText
                isLoading={isLoading}
                className="text-xl font-bold text-primary"
              >
                {value ? "TRUE" : "FALSE"}
              </PendingText>
            </div>
          </div>

          <div className="flex justify-center">
            <Button
              size="lg"
              disabled={flipTx.inBestBlockProgress}
              onClick={handleFlip}
              className="w-full bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 dark:from-gray-700 dark:to-gray-800 dark:hover:from-gray-600 dark:hover:to-gray-700 text-white"
            >
              {flipTx.inBestBlockProgress ? "Flipping..." : "Flip Value!"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
