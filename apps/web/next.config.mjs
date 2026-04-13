/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@projectpay/shared", "@projectpay/db"],
  serverExternalPackages: ["@prisma/client", "prisma"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "img.clerk.com" },
      { protocol: "https", hostname: "images.clerk.dev" },
    ],
  },
};

export default nextConfig;
