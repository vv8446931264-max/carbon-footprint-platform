export interface ImpactCardData {
  totalKgCo2e: number;
  periodDays: number;
  streak: number;
  topCategoryLabel: string | null;
}

const WIDTH = 1080;
const HEIGHT = 1080;

/**
 * Draws a shareable "impact card" onto a canvas and returns it as a PNG
 * data URL. Pure rendering logic lives here (separated from the React
 * component) so it can be unit-tested with a stubbed canvas context and
 * reused outside React if needed (e.g. a future server-side share image).
 */
export function drawImpactCard(
  ctx: CanvasRenderingContext2D,
  data: ImpactCardData,
): void {
  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  gradient.addColorStop(0, "#022c22");
  gradient.addColorStop(1, "#059669");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.textAlign = "left";
  ctx.fillStyle = "#ecfdf5";
  ctx.font = "600 40px system-ui, sans-serif";
  ctx.fillText("🌱 My Carbon Footprint Coach", 80, 140);

  ctx.fillStyle = "#ffffff";
  ctx.font = "700 120px system-ui, sans-serif";
  ctx.fillText(`${data.totalKgCo2e.toFixed(1)}`, 80, 360);

  ctx.fillStyle = "#d1fae5";
  ctx.font = "500 44px system-ui, sans-serif";
  ctx.fillText(`kg CO₂e over the last ${data.periodDays} days`, 80, 430);

  drawStatRow(
    ctx,
    80,
    560,
    "🔥",
    `${data.streak}-day streak`,
    "staying within my carbon budget",
  );
  drawStatRow(
    ctx,
    80,
    680,
    "📊",
    data.topCategoryLabel
      ? `Biggest impact: ${data.topCategoryLabel}`
      : "Just getting started",
    "tracked with AI-powered insights",
  );

  ctx.fillStyle = "#a7f3d0";
  ctx.font = "500 36px system-ui, sans-serif";
  ctx.fillText("Track yours at carbon-footprint-coach 🌍", 80, HEIGHT - 80);
}

function drawStatRow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  icon: string,
  title: string,
  subtitle: string,
): void {
  ctx.font = "44px system-ui, sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(icon, x, y);

  ctx.font = "600 40px system-ui, sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(title, x + 70, y);

  ctx.font = "400 30px system-ui, sans-serif";
  ctx.fillStyle = "#bbf7d0";
  ctx.fillText(subtitle, x + 70, y + 42);
}

export const IMPACT_CARD_DIMENSIONS = { width: WIDTH, height: HEIGHT };
