"use client";

import BalanceInsufficientAlert from "@/components/balance-insufficient-alert";
import NonMappedAccountAlert from "@/components/non-mapped-account-alert";
import PendingText from "@/components/pending-text";
import { txToaster } from "@/components/tx-toaster";
import { Button } from "@/components/ui/button";
import { ContractId } from "@/contracts/deployments";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StorageContractApi } from "@/contracts/types/storage";
import { useEffect, useState } from "react";
import {
  useContract,
  useContractQuery,
  useContractTx,
} from "typink";

export default function StorageBoard() {
  const { contract } = useContract<StorageContractApi>(ContractId.STORAGE);
  const storeTx = useContractTx(contract, "store");
  const [mounted, setMounted] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const { data: storedValue, isLoading } = useContractQuery({
    contract,
    fn: "retrieve",
    watch: true,
  });

  const handleStore = async () => {
    if (!contract || !inputValue.trim()) return;

    const toaster = txToaster('Signing transaction...');

    try {
      const numValue = BigInt(inputValue);
      await storeTx.signAndSend({
        args: [numValue],
        callback: (result) => {
          console.log(result.status);

          toaster.onTxProgress(result);
        },
      });
    } catch (e: any) {
      console.error(e, e.message);
      toaster.onTxError(e);
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
          <h1 className="text-3xl font-bold">Storage Contract</h1>
          <p className="text-muted-foreground">
            Store and retrieve numeric values on the blockchain
          </p>
        </div>

        <BalanceInsufficientAlert />
        <NonMappedAccountAlert />

        <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border rounded-xl p-8 shadow-lg space-y-8">
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-lg p-6 min-h-[80px] flex items-center justify-center">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground">Stored Value:</span>
                <PendingText
                  isLoading={isLoading}
                  className="text-xl font-bold text-primary"
                >
                  {storedValue?.toString() || "0"}
                </PendingText>
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="value-input" className="text-sm font-medium">
                Enter a number to store:
              </Label>
              <Input
                id="value-input"
                type="number"
                placeholder="Enter a number..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          <div className="flex justify-center">
            <Button
              size="lg"
              disabled={storeTx.inBestBlockProgress || !inputValue.trim()}
              onClick={handleStore}
              className="w-full bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 dark:from-gray-700 dark:to-gray-800 dark:hover:from-gray-600 dark:hover:to-gray-700 text-white"
            >
              {storeTx.inBestBlockProgress ? "Storing..." : "Store Value"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
