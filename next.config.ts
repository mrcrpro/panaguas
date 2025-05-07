
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    serverActions: { // Enabling server actions (bodySizeLimit can be adjusted if needed)
        bodySizeLimit: '2mb', // Default is 1mb, increased slightly
    },
  }
  // reactStrictMode: false, // Disabling strict mode (consider implications)
};

export default nextConfig;

