"use client";

import PendingText from "@/components/pending-text";
import WalletSelection from "@/components/dialog/wallet-selection";
import { useApp } from "@/components/app-provider";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  formatBalance,
  useContractQuery,
  useContractTx,
  usePSP22Balance,
  useTypink,
  useBalance,
} from "typink";
import { Loader2Icon } from "lucide-react";
import { useEffect, useState } from "react";

export default function Psp22Board() {
  const { psp22Contract: contract } = useApp();
  const { connectedAccount } = useTypink();
  const mintTx = useContractTx(contract, "psp22MintableMint");
  const balance = useBalance(connectedAccount?.address);
  const [mounted, setMounted] = useState(false);

  const { data: tokenName, isLoading: loadingTokenName } = useContractQuery({
    contract,
    fn: "psp22MetadataTokenName",
  });

  const { data: tokenSymbol, isLoading: loadingTokenSymbol } = useContractQuery(
    {
      contract,
      fn: "psp22MetadataTokenSymbol",
    }
  );

  const { data: tokenDecimal, isLoading: loadingTokenDecimal } =
    useContractQuery({
      contract,
      fn: "psp22MetadataTokenDecimals",
    });

  const {
    data: totalSupply,
    isLoading: loadingTotalSupply,
    refresh: refreshTotalSupply,
  } = useContractQuery({
    contract,
    fn: "psp22TotalSupply",
  });

  const { data: myBalance, isLoading: loadingBalance } = usePSP22Balance({
    contractAddress: contract?.address,
    address: connectedAccount?.address,
    watch: true,
  });

  const mintNewToken = async () => {
    if (!contract || !tokenDecimal) return;

    if (!connectedAccount) {
      toast.info("Please connect to your wallet");
      return;
    }

    if (balance?.free === 0n) {
      toast.error("Balance insufficient to make transaction.");
      return;
    }

    toast.loading("Minting tokens...", {
      description: "Please confirm in your wallet",
    });

    try {
      await mintTx.signAndSend({
        args: [BigInt(100 * Math.pow(10, tokenDecimal))],
        callback: (result) => {
          const { status } = result;
          console.log(status);

          if (status.type === "BestChainBlockIncluded") {
            refreshTotalSupply();
            toast.success("Tokens minted successfully!", {
              description: `100 ${tokenSymbol} tokens have been added to your balance`,
            });
          } else {
            toast.info(`Transaction ${status.type}`, {
              description: "Processing blockchain transaction...",
            });
          }
        },
      });
    } catch (e: any) {
      console.error(e);
      toast.error("Minting failed", {
        description: e.message || "Please try again",
      });
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">PSP22 Token Contract</h1>
          <p className="text-muted-foreground">
            Interact with PSP22 token contract - mint tokens and check balances
          </p>
        </div>

        <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border rounded-xl p-8 shadow-lg space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Token Information</h3>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                Token Name:{" "}
                <PendingText
                  isLoading={loadingTokenName}
                  className="font-semibold inline-block min-w-[80px]"
                >
                  {tokenName || "Unknown"}
                </PendingText>
              </div>
              <div>
                Symbol:{" "}
                <PendingText
                  isLoading={loadingTokenSymbol}
                  className="font-semibold inline-block min-w-[40px]"
                >
                  {tokenSymbol || "N/A"}
                </PendingText>
              </div>
              <div>
                Decimals:{" "}
                <PendingText
                  isLoading={loadingTokenDecimal}
                  className="font-semibold inline-block min-w-[20px]"
                >
                  {tokenDecimal || 0}
                </PendingText>
              </div>
              <div>
                Total Supply:{" "}
                <PendingText
                  isLoading={loadingTotalSupply}
                  className="font-semibold inline-block min-w-[100px]"
                >
                  {formatBalance(totalSupply, {
                    decimals: tokenDecimal,
                    symbol: tokenSymbol,
                  })}
                </PendingText>
              </div>
            </div>
          </div>

          <div className="border-t pt-6 space-y-4">
            <h3 className="text-lg font-semibold">Your Balance</h3>

            <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-lg p-6 min-h-[80px] flex items-center justify-center">
              {connectedAccount ? (
                <PendingText
                  isLoading={loadingBalance}
                  className="text-2xl font-bold"
                >
                  {formatBalance(myBalance, {
                    decimals: tokenDecimal,
                    symbol: tokenSymbol,
                  })}
                </PendingText>
              ) : (
                <div className="text-center space-y-3">
                  <p className="text-muted-foreground text-sm">
                    Connect wallet to view balance
                  </p>
                  <WalletSelection />
                </div>
              )}
            </div>

            {connectedAccount && (
              <Button
                onClick={mintNewToken}
                disabled={mintTx.inBestBlockProgress}
                className="w-full bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 dark:from-gray-700 dark:to-gray-800 dark:hover:from-gray-600 dark:hover:to-gray-700 text-white"
              >
                {mintTx.inBestBlockProgress ? (
                  <>
                    <Loader2Icon className="animate-spin mr-2" />
                    Minting...
                  </>
                ) : (
                  `Mint 100 ${tokenSymbol || "Tokens"}`
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
