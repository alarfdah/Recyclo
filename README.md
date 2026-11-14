# Recyclo

Recyclo identifies a plastic from a phone photo or a short description, then shows what it can be used for and the usual way to recycle it.

Advice is the same everywhere. It is general guidance, not a local collection lookup. There are no accounts and nothing is saved.

## Run

```bash
npm install
npm.cmd run dev
```

On this PC, use `npm.cmd` (not `npm`) if PowerShell blocks `npm.ps1` under the execution policy.

Open **http://localhost:3000** on the computer. `npm.cmd run dev` leaves Next’s default hostname so **Network** shows your LAN IPv4 (for example `http://192.168.18.10:3000`); use that or the **Phone** line on a phone. Production `start` still binds `0.0.0.0` for all interfaces.

Do not use Vite-style `npm run dev -- --host`. Next.js uses `-H` / `--hostname` only when you pass them yourself.

### Phone (same Wi‑Fi — LAN only)

Preferred path: phone and PC on the **same main Wi‑Fi**, then open the PC’s LAN URL. No public tunnel is required or recommended for normal testing.

1. Start the app (`npm.cmd run dev` or `npm.cmd start`). For dev, confirm **Network** (or **Phone**) shows your Wi‑Fi IPv4 on port 3000.
2. Join the phone to the **same SSID as the PC** (for example `NOKIA-CB41`). Avoid guest / IoT / “visitor” networks.
3. On the phone, open `http://<PC-Wi-Fi-IPv4>:3000` (for example `http://192.168.18.10:3000`). Use the **Network** or **Phone** line from `npm.cmd run dev`, or the Wi‑Fi IPv4 from `ipconfig`. Do **not** use `http://localhost:3000` on the phone.
4. Hot reload from a phone needs your LAN hostname in `allowedDevOrigins` in `next.config.ts` (already set for this PC’s Wi‑Fi / `192.168.*.*`). After changing that config, restart the dev server.
5. If the page never loads, check Windows Firewall (inbound TCP 3000 / Node). Elevated PowerShell example:

```powershell
New-NetFirewallRule -DisplayName "Recyclo Next.js 3000" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow
```

6. If PC↔phone still fails on the same SSID, the router may have **AP / client / wireless isolation** on. In the gateway admin UI, disable that (wording varies), and keep the phone off guest Wi‑Fi. Optional phone-side checks: turn off VPN, private DNS, and “randomized MAC” for this network while testing.

7. **Optional when LAN is blocked:** while the app is running, start a temporary public tunnel and open the printed HTTPS URL on the phone:

```bash
npx.cmd --yes cloudflared tunnel --url http://localhost:3000
```

Keep that terminal open while testing; stop with Ctrl+C when done. (`npx.cmd --yes localtunnel --port 3000` is a fallback if Cloudflare is unavailable.) Prefer fixing router isolation for normal day-to-day phone testing.

### Production

```bash
npm.cmd run rebuild
npm.cmd start
```

Or in one step: `npm.cmd run prod`.

### Deploy on Vercel

1. Push this repo to GitHub (already configured as `origin`).
2. On [vercel.com](https://vercel.com), **Add New… → Project** and import the GitHub repo.
3. Framework preset: **Next.js** (auto-detected). Leave build settings as default (`next build`).
4. In **Settings → Environment Variables**, add `OPENAI_API_KEY` (copy the value from your local `.env.local`). Apply to Production (and Preview if you want photo ID on preview deploys). Remove any old `GEMINI_API_KEY` if it is still set — it is no longer used.
5. Deploy. The app URL will look like `https://recyclo-….vercel.app` (or your custom domain).

Photo identification needs the env var on Vercel; without it, known descriptions and resin codes 1–7 still work from the built-in guide.

## Seeing UI changes

- **`npm.cmd run dev`** (Next.js development): save the file and refresh the browser. No rebuild needed.
- **`npm.cmd start`** (production): stop the server with Ctrl+C in that PowerShell window, then run `npm.cmd run rebuild` (or `npm.cmd run build`) and `npm.cmd start`. Hard-refresh the browser with Ctrl+Shift+R.

Production serves the built `.next` output, so CSS and UI edits in source files stay invisible until you rebuild.

## Photo reading

Copy `.env.example` to `.env.local` and set `OPENAI_API_KEY`. The server calls OpenAI `gpt-4o-mini` (via the Vercel AI SDK) only when that key is set. The key never goes to the browser. `GEMINI_API_KEY` is deprecated and ignored.

Without a key:

- A known description still works (`water bottle`, `milk jug`, `plastic bag`, `#2`).
- A photo, or a description that is not in the guide, asks you to pick resin code 1–7.

When the model names a code from 1 to 7, the page shows that guide entry. The model identifies the plastic. The guide supplies the reuse and recycle text.
