import type { NextConfig } from "next";
import os from "node:os";

/** Non-loopback IPv4s currently on this machine (for phone / LAN HMR). */
function lanDevOrigins(): string[] {
  const hosts = new Set<string>([
    // Current Wi-Fi IP when the cross-origin HMR warning was hit.
    "192.168.18.10",
    // Typical home LAN — DHCP can change the last two octets.
    "192.168.*.*",
  ]);

  for (const nets of Object.values(os.networkInterfaces())) {
    for (const net of nets ?? []) {
      const v4 = net.family === "IPv4" || net.family === 4;
      if (!v4 || net.internal) continue;
      hosts.add(net.address);
    }
  }

  return [...hosts];
}

const nextConfig: NextConfig = {
  // Dev-only: hostnames (no protocol/port) for phone / LAN HMR when opening via
  // Wi‑Fi IP. Not used on Vercel or other production HTTPS hosts.
  ...(process.env.NODE_ENV !== "production"
    ? { allowedDevOrigins: lanDevOrigins() }
    : {}),
};

export default nextConfig;
