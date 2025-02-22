/** @type {import('next').NextConfig} */
const nextConfig = {
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  output: "standalone",
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
    optimizeCss: true, // Otimiza CSS
    turbo: {
      loaders: {
        // Otimiza carregamento de imagens
        ".png": ["@vercel/image-loader"],
        ".jpg": ["@vercel/image-loader"],
      },
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
    formats: ["image/avif", "image/webp"], // Adiciona suporte a formatos modernos
  },
  // Adiciona compressão Gzip
  compress: true,
  // Otimiza carregamento de fontes
  optimizeFonts: true,
}

export default nextConfig

