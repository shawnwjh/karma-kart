import { cyrb128, sfc32 } from './rng';
import { add, mul, resampleClosed, computeNormals } from './geom';
import { makeValueNoise1D } from './noise';
import { TrackData, Vec2 } from './types';

function dailySeed(subreddit:string, dateUTC = new Date()):string {
  const y = dateUTC.getUTCFullYear();
  const m = String(dateUTC.getUTCMonth()+1).padStart(2,'0');
  const d = String(dateUTC.getUTCDate()).padStart(2,'0');
  return `${subreddit}-${y}-${m}-${d}`;
}

export function generateTrack(subreddit:string, opts?:{
  radius?: number; spacing?: number; baseWidth?: number; widthAmp?: number;
  upsEveryMeters?: number; downsPer100m?: number;
}): TrackData {
  const {
    radius=220, spacing=2, baseWidth=50, widthAmp=10, // Tighter spacing for smoother curves
    upsEveryMeters=22, downsPer100m=3
  } = opts || {};
  const seedStr = dailySeed(subreddit);
  const [a,b,c,d] = cyrb128(seedStr);
  const rnd = sfc32(a,b,c,d);

  // 1) rough loop of control points around a circle - fewer points for smoother curves
  const CTRL = 8 + Math.floor(rnd()*4); // 8–11 points (much smoother)
  const controls:Vec2[] = [];
  for (let i=0;i<CTRL;i++) {
    const t = (i/CTRL)*Math.PI*2 + rnd()*0.1; // much less jitter for smoother curves
    const r = radius * (0.9 + rnd()*0.2);     // less radius variation for consistent curves
    controls.push({ x: Math.cos(t)*r, y: Math.sin(t)*r });
  }

  // 2) resample to even spacing
  const center = resampleClosed(controls, spacing);

  // 3) normals + width map via low-freq noise
  const normals = computeNormals(center);
  const noise = makeValueNoise1D(rnd);
  const width = center.map((_, i) => {
    const t = i / center.length;
    // Very smooth width variation to prevent jarring changes
    const widthVariation = widthAmp * noise(t*2) * 0.4; // much lower frequency and amplitude
    return Math.max(baseWidth * 0.9, baseWidth + widthVariation); // less variation range
  });

  // 4) scatter pickups
  // compute cumulative length so we can drop ups every N meters
  const meters = center.length * spacing;
  const upEvery = upsEveryMeters;
  const ups:Vec2[] = [];
  let acc = 0, idx = 0;
  while (acc < meters) {
    const i = Math.floor(idx) % center.length;
    const p = center[i];
    const n = normals[i];
    const w = width[i];
    if (p && n && w !== undefined) {
      // place near centerline with slight sway
      const sway = (rnd()*2-1) * (w*0.25);
      ups.push(add(p, mul(n, sway)));
    }
    acc += upEvery; idx += upEvery/spacing;
  }

  // downs: random off-line bait near apex exits (approx every 100m)
  const downs:Vec2[] = [];
  const downsCount = Math.floor((meters/100) * downsPer100m);
  for (let k=0;k<downsCount;k++) {
    const i = Math.floor(rnd()*center.length);
    const p = center[i];
    const n = normals[i];
    const w = width[i];
    if (p && n && w !== undefined) {
      const offset = (w*0.5) * (rnd()<0.5? -1 : 1); // near edge
      downs.push(add(p, mul(n, offset)));
    }
  }

  const pickups = [
    ...ups.map(p=>({p, kind:'up' as const})),
    ...downs.map(p=>({p, kind:'down' as const})),
  ];

  return { center, normals, width, pickups, seed: seedStr };
}