"use client";

import NetworkSelection from "@/components/network-selection";
import { GithubSvgIcon, XSvgIcon } from "@/components/icons";
import NoSsr from "@/components/no-ssr";

export default function MainFooter() {
  return (
    <div className="border-t border-gray-200 dark:border-gray-800">
      <div className="max-w-4xl px-4 mx-auto flex justify-between items-center gap-4 py-4">
        <div className="flex gap-6">
          <a
            href="https://twitter.com/realsinzii"
            target="_blank"
            rel="noopener noreferrer"
          >
            <NoSsr>
              <XSvgIcon />
            </NoSsr>
          </a>
          <a
            href="https://github.com/dedotdev/typink"
            target="_blank"
            rel="noopener noreferrer"
          >
            <NoSsr>
              <GithubSvgIcon />
            </NoSsr>
          </a>
        </div>
        <NetworkSelection />
      </div>
    </div>
  );
}
