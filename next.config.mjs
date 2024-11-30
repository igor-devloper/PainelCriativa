/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
    ],
   },
   experimental: {
    serverActions: {
      bodySizeLimit: '10mb' // Set this to whatever limit you need
    }
  }
};

export default nextConfig;
