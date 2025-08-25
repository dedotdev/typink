"use client";

import AccountSelection from "@/components/dialog/account-selection";
import WalletSelection from "@/components/dialog/wallet-selection";
import { ThemeToggle } from "@/components/theme-toggle";
import { useTypink } from "typink";
import Link from "next/link";
import NoSsr from "@/components/no-ssr";
import TypinkLogo from "@/components/icons";

export default function MainHeader() {
  const { accounts } = useTypink();

  return (
    <div className="border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-4xl px-4 mx-auto flex justify-between items-center gap-4 h-16">
        <Link href="/" className="w-24">
          <NoSsr>
            <TypinkLogo />
          </NoSsr>
        </Link>
        <div className="flex items-center gap-3">
          {accounts.length > 0 ? <AccountSelection /> : <WalletSelection />}
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}
