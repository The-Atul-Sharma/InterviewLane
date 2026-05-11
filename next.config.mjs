/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
    workerThreads: false,
    cpus: 2,
  },
};

export default nextConfig;
