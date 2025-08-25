/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
        port: '',
        pathname: '/dedotdev/typink/refs/heads/main/assets/typink/**',
        search: '',
      },
    ],
  },
};

export default nextConfig;
