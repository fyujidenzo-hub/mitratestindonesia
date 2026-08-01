import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const paymentProofMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const extensionByMimeType: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

export function paymentProofStorageName(mimeType: string) {
  return `${Date.now()}-${randomUUID()}${extensionByMimeType[mimeType] || ".jpg"}`;
}

export function legacyPaymentProofPath(fileName: string) {
  if (!fileName || path.basename(fileName) !== fileName) return null;

  const moduleDirectory = path.dirname(fileURLToPath(import.meta.url));
  const candidates = [
    path.resolve(process.cwd(), "uploads", fileName),
    path.resolve(process.cwd(), "server", "uploads", fileName),
    path.resolve(moduleDirectory, "../../uploads", fileName),
    path.resolve(moduleDirectory, "../../../uploads", fileName),
  ];

  return candidates.find((candidate) => existsSync(candidate)) || null;
}

export function inlineFileName(fileName: string) {
  return encodeURIComponent(fileName)
    .replace(/['()]/g, (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`)
    .replace(/\*/g, "%2A");
}

export function missingPaymentProofPage() {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Payment proof unavailable</title>
    <style>
      * { box-sizing: border-box; }
      html { min-height: 100%; background: #fff7f3; }
      body {
        min-width: 320px;
        min-height: 100vh;
        margin: 0;
        display: grid;
        place-items: center;
        padding: 24px;
        color: #172033;
        background:
          radial-gradient(circle at 80% 15%, rgba(238, 77, 45, .14), transparent 32%),
          linear-gradient(145deg, #fff 0%, #fff7f3 100%);
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      main {
        width: min(100%, 560px);
        padding: clamp(32px, 7vw, 56px);
        border: 1px solid #ffe0d7;
        border-radius: 28px;
        background: rgba(255, 255, 255, .94);
        box-shadow: 0 24px 70px rgba(92, 35, 22, .12);
        text-align: center;
      }
      .mark {
        display: grid;
        width: 64px;
        height: 64px;
        margin: 0 auto 24px;
        place-items: center;
        border-radius: 22px;
        color: #fff;
        background: linear-gradient(135deg, #ee4d2d, #ff7a45);
        box-shadow: 0 14px 30px rgba(238, 77, 45, .25);
        font-size: 30px;
        font-weight: 900;
      }
      .eyebrow {
        margin: 0 0 10px;
        color: #ee4d2d;
        font-size: 12px;
        font-weight: 900;
        letter-spacing: .14em;
        text-transform: uppercase;
      }
      h1 { margin: 0; font-size: clamp(26px, 6vw, 38px); line-height: 1.12; }
      .message { margin: 18px auto 0; color: #64748b; font-size: 16px; font-weight: 600; line-height: 1.7; }
    </style>
  </head>
  <body>
    <main>
      <div class="mark" aria-hidden="true">!</div>
      <p class="eyebrow">Shopee Work Indonesia</p>
      <h1>Payment proof unavailable</h1>
      <p class="message">The original payment proof file is no longer available. Ask the member to submit it again.</p>
    </main>
  </body>
</html>`;
}
