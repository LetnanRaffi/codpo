import type { NextConfig } from "next";

const r2PublicBase = process.env.R2_PUBLIC_BASE_URL;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: r2PublicBase
      ? [new URL(`${r2PublicBase.replace(/\/$/, "")}/**`)]
      : [],
  },
};

export default nextConfig;
