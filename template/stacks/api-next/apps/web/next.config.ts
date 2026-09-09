import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  transpilePackages: ["@f7t/api-client", "@f7t/design-system"],
};

export default nextConfig;
