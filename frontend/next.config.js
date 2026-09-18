/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  images: {
    domains: ['localhost', '192.168.100.105', '100.107.163.24'],
    unoptimized: true,
  },
  async rewrites() {
    return [
      { source: '/api/:path*', destination: 'http://backend:8080/api/:path*' },
      { source: '/uploads/:path*', destination: 'http://backend:8080/uploads/:path*' },
      { source: '/documents/:path*', destination: 'http://backend:8080/documents/:path*' },
    ];
  },
};

module.exports = nextConfig;
