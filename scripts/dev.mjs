import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import os from "node:os";

const require = createRequire(import.meta.url);
const nextBin = require.resolve("next/dist/bin/next");

function lanIPv4s() {
  const addresses = [];
  for (const nets of Object.values(os.networkInterfaces())) {
    for (const net of nets ?? []) {
      const v4 = net.family === "IPv4" || net.family === 4;
      if (!v4 || net.internal) continue;
      addresses.push(net.address);
    }
  }
  return addresses;
}

function preferredLanIPv4() {
  const all = lanIPv4s();
  return (
    all.find((ip) => ip.startsWith("192.168.")) ??
    all.find((ip) => ip.startsWith("10.")) ??
    all[0] ??
    null
  );
}

const port = process.env.PORT || "3000";
const phoneIp = preferredLanIPv4();

// Do not pass -H 0.0.0.0: Next prints that literal as Network.
// Omitting -H keeps Local as localhost, prints Network as the detected LAN IP,
// and still listens on all interfaces (phone can use the Network URL).
if (phoneIp) {
  console.log(`\n  Phone (same Wi-Fi): http://${phoneIp}:${port}\n`);
} else {
  console.log(
    "\n  No LAN IPv4 found. On the phone, use this PC's Wi-Fi address from ipconfig.\n",
  );
}

const child = spawn(
  process.execPath,
  [nextBin, "dev", ...process.argv.slice(2)],
  { stdio: "inherit", env: process.env },
);

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
