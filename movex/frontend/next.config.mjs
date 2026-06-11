/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_EXECUTION_ENGINE_URL: process.env.NEXT_PUBLIC_EXECUTION_ENGINE_URL,
    NEXT_PUBLIC_MOVEX_ADDR: process.env.NEXT_PUBLIC_MOVEX_ADDR,
    NEXT_PUBLIC_MOVEMENT_NETWORK: process.env.NEXT_PUBLIC_MOVEMENT_NETWORK,
  },
};

export default nextConfig;
