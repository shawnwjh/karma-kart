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
    radius=200, spacing=3, baseWidth=35, widthAmp=8, // Much wider track and larger radius
    upsEveryMeters=22, downsPer100m=3
  } = opts || {};
  const seedStr = dailySeed(subreddit);
  const [a,b,c,d] = cyrb128(seedStr);
  const rnd = sfc32(a,b,c,d);

  // 1) rough loop of control points around a circle - more points for complexity
  const CTRL = 16 + Math.floor(rnd()*8); // 16–23 points (much more complex)
  const controls:Vec2[] = [];
  for (let i=0;i<CTRL;i++) {
    const t = (i/CTRL)*Math.PI*2 + rnd()*0.3; // reduced jitter to prevent overlap
    const r = radius * (0.8 + rnd()*0.4);     // tighter radius variation to prevent crossing
    controls.push({ x: Math.cos(t)*r, y: Math.sin(t)*r });
  }

  // 2) resample to even spacing
  const center = resampleClosed(controls, spacing);

  // 3) normals + width map via low-freq noise
  const normals = computeNormals(center);
  const noise = makeValueNoise1D(rnd);
  const width = center.map((_, i) => {
    const t = i / center.length;
    // More controlled width variation to maintain lane separation
    const widthVariation = widthAmp * noise(t*4) * 0.7; // reduced amplitude
    return Math.max(baseWidth * 0.8, baseWidth + widthVariation); // ensure minimum width
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