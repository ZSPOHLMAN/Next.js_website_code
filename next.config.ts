import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
};

module.exports = {
  allowedDevOrigins: ['172.19.136.183'],
}

module.exports = {
  logging: {
    browserToTerminal: true, // Forwards all console logs to your terminal
  },
}

export default nextConfig;
