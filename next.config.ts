/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'image.tmdb.org',
        pathname: '/t/p/**',
      },
    ],
  },
  typescript: {
    // Ігноруємо помилки типів під час збірки
    ignoreBuildErrors: true,
  },
  experimental: {
    /* Next.js 15 експериментальні функції */
  },
};

export default nextConfig;