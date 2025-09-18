import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      new URL(
        "https://raw.githubusercontent.com/dedotdev/typink/refs/heads/main/assets/typink/**"
      ),
    ],
  },
};

export default nextConfig;
