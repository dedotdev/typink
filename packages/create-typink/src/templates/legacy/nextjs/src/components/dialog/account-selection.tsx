"use client"

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ConnectedWallet from "@/components/dialog/connected-wallet";
import WalletSelection from "@/components/dialog/wallet-selection";
import { shortenAddress } from "@/lib/utils";
import { formatBalance, useBalances, useTypink } from "typink";

export default function AccountSelection() {
  const {
    accounts,
    connectedAccount,
    setConnectedAccount,
    disconnect,
    network,
  } = useTypink();
  const addresses = useMemo(() => accounts.map((a) => a.address), [accounts]);
  const balances = useBalances(addresses);
  const [showWalletSelection, setShowWalletSelection] = useState(false);

  useEffect(() => {
    if (
      connectedAccount &&
      accounts.map((one) => one.address).includes(connectedAccount.address)
    ) {
      return;
    }

    setConnectedAccount(accounts[0]);
  }, [accounts, connectedAccount, setConnectedAccount]);

  if (!connectedAccount) {
    return null;
  }

  const { name, address } = connectedAccount;

  return (
    <div className="flex items-center gap-2">
      {/* Account Selection */}
      <Select
        value={address}
        onValueChange={(selectedAddress) => {
          const selectedAccount = accounts.find(acc => acc.address === selectedAddress);
          if (selectedAccount) {
            setConnectedAccount(selectedAccount);
          }
        }}
      >
        <SelectTrigger className="w-fit min-w-[180px]">
          <SelectValue>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">{name}</span>
              <span className="text-sm font-normal text-muted-foreground">
                ({shortenAddress(address)})
              </span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="w-64">
          <div className="p-2 border-b">
            <ConnectedWallet />
          </div>
          {accounts.map((one) => (
            <SelectItem key={one.address} value={one.address}>
              <div className="flex flex-col items-start gap-1 py-1">
                <span className="font-medium">{one.name}</span>
                <span className="text-xs text-muted-foreground">
                  Address: {shortenAddress(one.address)}
                </span>
                <span className="text-xs text-muted-foreground">
                  Balance: {formatBalance(balances[one.address]?.free, network)}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Actions Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="1" />
              <circle cx="19" cy="12" r="1" />
              <circle cx="5" cy="12" r="1" />
            </svg>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem
            onClick={() => setShowWalletSelection(true)}
            className="text-primary"
          >
            Switch Wallet
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={disconnect}
            variant="destructive"
            className="text-destructive"
          >
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Wallet Selection Dialog - Outside of DropdownMenu */}
      {showWalletSelection && (
        <WalletSelection
          onDialogClose={() => setShowWalletSelection(false)}
        />
      )}
    </div>
  );
}
