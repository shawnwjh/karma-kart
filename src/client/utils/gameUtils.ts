import type { Vec2, TrackData } from '../../shared/track/types';

/** Vector helpers */
export const v = (x = 0, y = 0): Vec2 => ({ x, y });
export const add = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x + b.x, y: a.y + b.y });
export const sub = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x - b.x, y: a.y - b.y });
export const mul = (a: Vec2, s: number): Vec2 => ({ x: a.x * s, y: a.y * s });
export const len = (a: Vec2): number => Math.hypot(a.x, a.y);
export const norm = (a: Vec2): Vec2 => { 
  const L = len(a) || 1; 
  return { x: a.x / L, y: a.y / L }; 
};

/** Math utilities */
export const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));
export const angleOf = (a: Vec2, b: Vec2) => Math.atan2(b.y - a.y, b.x - a.x);

/** Fit world→canvas coords for this track and canvas size */
export function makeWorldToCanvas(points: Vec2[], W: number, H: number, pad = 24) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of points) {
    minX = Math.min(minX, p.x); minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y);
  }
  const sx = (W - pad * 2) / (maxX - minX);
  const sy = (H - pad * 2) / (maxY - minY);
  const s = Math.min(sx, sy);
  const ox = (W - (maxX - minX) * s) / 2 - minX * s;
  const oy = (H - (maxY - minY) * s) / 2 - minY * s;
  return (p: Vec2) => ({ x: p.x * s + ox, y: p.y * s + oy });
}

/** Nearest center index search in a small window */
export function nearestIndex(track: TrackData, pos: Vec2, hint: number, window = 40) {
  const n = track.center.length;
  let best = hint, bestD = Infinity;
  for (let k = -window; k <= window; k++) {
    const i = (hint + k + n) % n;
    const center = track.center[i];
    if (center) {
      const d = len(sub(pos, center));
      if (d < bestD) { bestD = d; best = i; }
    }
  }
  return best;
}

/** Signed lateral offset (+ left, − right) and half-width at idx */
export function signedOffsetFromCenter(track: TrackData, pos: Vec2, idx: number) {
  const center = track.center[idx];
  const normal = track.normals[idx];
  const width = track.width[idx];
  
  if (!center || !normal || width === undefined) {
    return { offset: 0, half: 0 };
  }
  
  const toPoint = sub(pos, center);
  const half = width * 0.5;
  const offset = toPoint.x * normal.x + toPoint.y * normal.y; // dot(toPoint, normal)
  return { offset, half };
}

/** Minimal cyclic distance between two indices on 0..n-1 ring */
export function cyclicDistance(a: number, b: number, n: number) {
  let d = Math.abs(a - b);
  if (d > n / 2) d = n - d;
  return d;
}
