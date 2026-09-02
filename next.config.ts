import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Las fotos del stock se guardan en public/uploads y se sirven como estáticos.
  images: { unoptimized: true },
};

export default nextConfig;
