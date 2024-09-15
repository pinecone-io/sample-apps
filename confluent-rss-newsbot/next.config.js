/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        tls: false,
        fs: false,
        child_process: false,
        crypto: require.resolve('crypto-browserify'),
        path: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
