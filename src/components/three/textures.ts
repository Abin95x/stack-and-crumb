import * as THREE from "three";
import { cached, rng } from "./geometry";

type Draw = (ctx: CanvasRenderingContext2D, w: number, h: number) => void;

function canvasTexture(key: string, w: number, h: number, draw: Draw, repeat = false) {
  return cached(`tex:${key}`, () => {
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    draw(canvas.getContext("2d")!, w, h);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    if (repeat) tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    return tex;
  });
}

function speckle(ctx: CanvasRenderingContext2D, w: number, h: number, n: number, colors: string[], seed: number, size = 2) {
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = colors[Math.floor(r() * colors.length)];
    ctx.globalAlpha = 0.05 + r() * 0.12;
    ctx.beginPath();
    ctx.ellipse(r() * w, r() * h, size * (0.5 + r()), size * (0.3 + r() * 0.7), r() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/** Cross-section of a tomato slice, mapped onto a cylinder cap. */
export const tomatoCap = () =>
  canvasTexture("tomato", 512, 512, (ctx, s) => {
    const c = s / 2;
    const r = rng(7);
    ctx.fillStyle = "#c8261a";
    ctx.fillRect(0, 0, s, s);
    ctx.fillStyle = "#e8402a";
    ctx.beginPath();
    ctx.arc(c, c, s * 0.475, 0, Math.PI * 2);
    ctx.fill();
    // Flesh wall
    const g = ctx.createRadialGradient(c, c, s * 0.05, c, c, s * 0.46);
    g.addColorStop(0, "#ffb296");
    g.addColorStop(1, "#ff6242");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(c, c, s * 0.445, 0, Math.PI * 2);
    ctx.fill();
    // Locules with jelly and seeds
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * Math.PI * 2 + 0.3;
      const x = c + Math.cos(a) * s * 0.24;
      const y = c + Math.sin(a) * s * 0.24;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(a);
      ctx.fillStyle = "#ffc09a";
      ctx.beginPath();
      ctx.ellipse(0, 0, s * 0.13, s * 0.085, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,226,170,0.7)";
      ctx.beginPath();
      ctx.ellipse(0, 0, s * 0.1, s * 0.06, 0, 0, Math.PI * 2);
      ctx.fill();
      for (let i = 0; i < 8; i++) {
        ctx.fillStyle = "#f3d36f";
        ctx.beginPath();
        ctx.ellipse((r() - 0.5) * s * 0.16, (r() - 0.5) * s * 0.08, s * 0.014, s * 0.008, r() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
    ctx.fillStyle = "#ffc7ae";
    ctx.beginPath();
    ctx.arc(c, c, s * 0.075, 0, Math.PI * 2);
    ctx.fill();
  });

export const pickleCap = () =>
  canvasTexture("pickle", 256, 256, (ctx, s) => {
    const c = s / 2;
    const r = rng(11);
    ctx.fillStyle = "#3f5a17";
    ctx.fillRect(0, 0, s, s);
    ctx.fillStyle = "#b8c464";
    ctx.beginPath();
    ctx.arc(c, c, s * 0.44, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#9aab48";
    ctx.lineWidth = s * 0.03;
    ctx.beginPath();
    ctx.arc(c, c, s * 0.3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "#d5dc97";
    ctx.beginPath();
    ctx.arc(c, c, s * 0.2, 0, Math.PI * 2);
    ctx.fill();
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2 + r() * 0.2;
      ctx.fillStyle = "#f0efcf";
      ctx.beginPath();
      ctx.ellipse(c + Math.cos(a) * s * 0.2, c + Math.sin(a) * s * 0.2, s * 0.03, s * 0.017, a, 0, Math.PI * 2);
      ctx.fill();
    }
  });

/** Top crust of the roll: u wraps around, v runs along its length. */
export const rollTopCrust = () =>
  canvasTexture("rollTop", 512, 1024, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, "#f0cf92");
    g.addColorStop(0.2, "#d99244");
    g.addColorStop(0.5, "#b8652a");
    g.addColorStop(0.8, "#d99244");
    g.addColorStop(1, "#f0cf92");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    speckle(ctx, w, h, 5000, ["#7a3d14", "#f7dca8", "#a4531f"], 3);
    const r = rng(5);
    for (let k = 0; k < 5; k++) {
      const y = h * (0.17 + k * 0.165);
      ctx.save();
      ctx.translate(w * (0.5 + (r() - 0.5) * 0.06), y);
      ctx.rotate(-0.9);
      const sg = ctx.createLinearGradient(0, -h * 0.03, 0, h * 0.03);
      sg.addColorStop(0, "#7e3f16");
      sg.addColorStop(0.3, "#e8b56b");
      sg.addColorStop(1, "#d39148");
      ctx.fillStyle = sg;
      ctx.beginPath();
      ctx.ellipse(0, 0, w * 0.27, h * 0.024, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    // Darker toasted tips
    const tips = ctx.createLinearGradient(0, 0, 0, h);
    tips.addColorStop(0, "rgba(110,50,15,0.55)");
    tips.addColorStop(0.1, "rgba(110,50,15,0)");
    tips.addColorStop(0.9, "rgba(110,50,15,0)");
    tips.addColorStop(1, "rgba(110,50,15,0.55)");
    ctx.fillStyle = tips;
    ctx.fillRect(0, 0, w, h);
  });

export const rollBottomCrust = () =>
  canvasTexture("rollBottom", 256, 512, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, "#efcd90");
    g.addColorStop(0.5, "#c98a45");
    g.addColorStop(1, "#efcd90");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    speckle(ctx, w, h, 2500, ["#8a4a1c", "#fbe9c6"], 9);
  });
