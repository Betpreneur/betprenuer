import logoFull from "@/assets/betpreneur-logo-horizontal.png";

export interface SharePick {
  fixture: string;
  market: string;
  odds: number | string;
  confidence?: number;
  league?: string;
  status?: string;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function truncate(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(t + "…").width > maxWidth) {
    t = t.slice(0, -1);
  }
  return t + "…";
}

/**
 * Render a dynamic "booking slip" style share card containing all of the
 * user's backed picks for the day. Height adapts to the number of picks.
 */
export async function renderPicksShareCard(
  picks: SharePick[],
  dateLabel: string,
): Promise<Blob | null> {
  try {
    return await renderImpl(picks, dateLabel);
  } catch (e) {
    console.error("renderPicksShareCard failed:", e);
    return null;
  }
}

async function renderImpl(picks: SharePick[], dateLabel: string): Promise<Blob | null> {
  const W = 1080;
  const PAD = 56;
  const HEADER_H = 300;
  const ROW_H = 150;
  const GAP = 16;
  const FOOTER_H = 200;
  const listH = picks.length * ROW_H + Math.max(0, picks.length - 1) * GAP;
  const H = HEADER_H + listH + FOOTER_H + PAD;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.textBaseline = "top";

  const GREEN = "#16c172";
  const WHITE = "#ffffff";
  const MUTED = "rgba(255,255,255,0.55)";

  // Background
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#0b1411");
  bg.addColorStop(0.5, "#0a0d0c");
  bg.addColorStop(1, "#000000");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const glow = ctx.createRadialGradient(W / 2, 120, 40, W / 2, 120, 700);
  glow.addColorStop(0, "rgba(22,193,114,0.30)");
  glow.addColorStop(1, "rgba(22,193,114,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, 600);

  // ---- Header ----
  try {
    const logo = await loadImage(logoFull);
    const lh = 80;
    const lw = (logo.width / logo.height) * lh;
    ctx.drawImage(logo, (W - lw) / 2, 56, lw, lh);
  } catch {
    ctx.fillStyle = WHITE;
    ctx.font = "900 56px Montserrat, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("BETPRENEUR", W / 2, 70);
    ctx.textAlign = "left";
  }

  ctx.textAlign = "center";
  ctx.fillStyle = WHITE;
  ctx.font = "900 64px Montserrat, sans-serif";
  ctx.fillText("MY PICKS TODAY", W / 2, 168);

  ctx.fillStyle = GREEN;
  ctx.font = "700 28px Montserrat, sans-serif";
  ctx.fillText(dateLabel.toUpperCase(), W / 2, 244);
  ctx.textAlign = "left";

  // ---- Pick rows ----
  let y = HEADER_H;
  for (const p of picks) {
    const x = PAD;
    const rowW = W - PAD * 2;
    roundRect(ctx, x, y, rowW, ROW_H, 22);
    ctx.fillStyle = "rgba(255,255,255,0.05)";
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "rgba(22,193,114,0.25)";
    ctx.stroke();

    // Left accent bar
    ctx.fillStyle = GREEN;
    roundRect(ctx, x, y + 24, 8, ROW_H - 48, 4);
    ctx.fill();

    const tx = x + 40;
    const confW = 150;
    const textMax = rowW - 40 - confW - 40;

    // Market / selection
    ctx.fillStyle = WHITE;
    ctx.font = "800 40px Montserrat, sans-serif";
    ctx.fillText(truncate(ctx, p.market || "Pick", textMax), tx, y + 28);

    // Fixture - handle both API (fixture) and localStorage (match) formats
    ctx.fillStyle = MUTED;
    ctx.font = "600 26px Montserrat, sans-serif";
    const fixtureText = p.fixture || (p as any).match || "Unknown match";
    const sub = p.league ? `${fixtureText}  ·  ${p.league}` : fixtureText;
    ctx.fillText(truncate(ctx, sub, textMax), tx, y + 82);

    // Odds + confidence (right)
    const rx = x + rowW - 36;
    ctx.textAlign = "right";
    ctx.fillStyle = GREEN;
    ctx.font = "900 46px Montserrat, sans-serif";
    ctx.fillText(Number(p.odds).toFixed(2), rx, y + 30);
    if (typeof p.confidence === "number") {
      ctx.fillStyle = MUTED;
      ctx.font = "700 24px Montserrat, sans-serif";
      ctx.fillText(`${p.confidence.toFixed(0)}% conf`, rx, y + 88);
    }
    ctx.textAlign = "left";

    y += ROW_H + GAP;
  }

  // ---- Footer CTA ----
  const domain =
    typeof window !== "undefined" ? window.location.hostname : "betpreneur.ng";
  let fy = y + 24;
  roundRect(ctx, PAD, fy, W - PAD * 2, FOOTER_H - 60, 24);
  ctx.fillStyle = "rgba(22,193,114,0.12)";
  ctx.fill();
  ctx.strokeStyle = "rgba(22,193,114,0.4)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.fillStyle = WHITE;
  ctx.font = "800 38px Montserrat, sans-serif";
  ctx.fillText("Get daily edge picks — join free", W / 2, fy + 34);
  ctx.fillStyle = GREEN;
  ctx.font = "900 44px Montserrat, sans-serif";
  ctx.fillText(domain, W / 2, fy + 86);
  ctx.textAlign = "left";

  return await new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/png"));
}

export function buildShareCaption(count: number): string {
  const domain =
    typeof window !== "undefined" ? window.location.hostname : "betpreneur.ng";
  const protocol =
    typeof window !== "undefined" ? window.location.protocol : "https:";
  const url = `${protocol}//${domain}`;
  return [
    `🎯 My ${count} backed pick${count === 1 ? "" : "s"} on Betpreneur today`,
    ``,
    `Data-driven football picks with confidence ratings.`,
    `Join free & get daily edge picks 👇`,
    url,
  ].join("\n");
}
