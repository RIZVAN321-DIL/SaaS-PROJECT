/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  basePath: '/SaaS-PROJECT',
  assetPrefix: '/SaaS-PROJECT/',
};

module.exports = nextConfig;
