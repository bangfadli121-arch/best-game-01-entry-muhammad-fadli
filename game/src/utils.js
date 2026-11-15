// Small deterministic math helpers used by every simulation system.
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const lerp=(a,b,t)=>a+(b-a)*t;
export const dist2=(a,b)=>{const x=a.x-b.x,y=a.y-b.y;return x*x+y*y};
export const TAU=Math.PI*2;
export function rng(seed=1){let s=seed>>>0;return()=>{s=(s+0x6D2B79F5)|0;let t=Math.imul(s^s>>>15,1|s);t=(t+Math.imul(t^t>>>7,61|t))^t;return((t^t>>>14)>>>0)/4294967296;};}
