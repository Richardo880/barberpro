import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Disable ESLint during build due to eslint-config-next compatibility issues
    // Run `npm run lint` separately for linting
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
