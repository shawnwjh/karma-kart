export function makeValueNoise1D(rnd:()=>number) {
  const table = new Float32Array(512);
  for (let i=0;i<table.length;i++) table[i] = rnd()*2-1;
  const fade = (t:number)=>t*t*(3-2*t);
  return (x:number) => {
    const xi = Math.floor(x) & 511, xf = x - Math.floor(x);
    const v0 = table[xi], v1 = table[(xi+1)&511];
    return v0 + (v1 - v0) * fade(xf); // [-1,1]
  };
}