import { Vec2 } from './types';

export const add = (a:Vec2,b:Vec2):Vec2 => ({x:a.x+b.x,y:a.y+b.y});
export const sub = (a:Vec2,b:Vec2):Vec2 => ({x:a.x-b.x,y:a.y-b.y});
export const mul = (a:Vec2,s:number):Vec2 => ({x:a.x*s,y:a.y*s});
export const len = (a:Vec2):number => Math.hypot(a.x,a.y);
export const norm = (a:Vec2):Vec2 => { const L=len(a)||1; return {x:a.x/L,y:a.y/L}; };
export const perpL = (a:Vec2):Vec2 => ({x:-a.y,y:a.x}); // left-hand normal

export function catmullRom(p0:Vec2,p1:Vec2,p2:Vec2,p3:Vec2,t:number):Vec2 {
  const t2=t*t, t3=t2*t;
  return {
    x: 0.5*((2*p1.x) + (-p0.x+p2.x)*t + (2*p0.x-5*p1.x+4*p2.x-p3.x)*t2 + (-p0.x+3*p1.x-3*p2.x+p3.x)*t3),
    y: 0.5*((2*p1.y) + (-p0.y+p2.y)*t + (2*p0.y-5*p1.y+4*p2.y-p3.y)*t2 + (-p0.y+3*p1.y-3*p2.y+p3.y)*t3),
  };
}

export function resampleClosed(points:Vec2[], spacing=6):Vec2[] {
  // sample CR-spline between each pair (closed), accumulate by arc length
  const n=points.length; const samples:Vec2[]=[];
  let acc=0, prev=points[0]; samples.push(prev);
  const step=0.02; // param step; resample to fixed spacing
  for (let i=0;i<n;i++) {
    const p0=points[(i-1+n)%n], p1=points[i], p2=points[(i+1)%n], p3=points[(i+2)%n];
    for (let t=step;t<=1+1e-6;t+=step) {
      const pt = catmullRom(p0,p1,p2,p3,t);
      acc += len(sub(pt,prev));
      while (acc >= spacing) {
        // place point exactly spacing ahead by linear interp
        const overshoot = acc - spacing;
        const dir = norm(sub(pt,prev));
        const exact = sub(pt, mul(dir, overshoot));
        samples.push(exact);
        acc = 0;
        prev = exact;
      }
      prev = pt;
    }
  }
  return samples;
}

export function computeNormals(center:Vec2[]):Vec2[] {
  const n=center.length; const out:Vec2[] = new Array(n);
  for (let i=0;i<n;i++) {
    const a=center[(i-1+n)%n], b=center[(i+1)%n];
    const tan = norm(sub(b,a));
    out[i] = norm(perpL(tan)); // left normal
  }
  return out;
}
