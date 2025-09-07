import { useEffect, useRef, useState } from 'react';
import type { TrackData, Vec2 } from '../../shared/track/types';
import { COLORS, PHYSICS, CAR, PICKUP, GAME } from '../constants/gameConstants';
import { 
  v, add, sub, mul, len, clamp, 
  makeWorldToCanvas, nearestIndex, signedOffsetFromCenter 
} from '../utils/gameUtils';
import type { PickupExt, GameState } from '../types/gameTypes';

type Props = {
  track: TrackData;
  username?: string;
  onRunEnd?: (result: { 
    up: number; 
    down: number; 
    timeMs: number; 
    distance: number; 
  }) => void;
};

// Function to fetch Reddit user avatar via our server
async function fetchRedditAvatar(username: string): Promise<string | null> {
  try {
    const response = await fetch(`/api/avatar/${username}`);
    if (!response.ok) {
      console.warn('Failed to fetch avatar:', response.statusText);
      return null;
    }
    const data = await response.json();
    return data.avatarUrl || null;
  } catch (error) {
    console.warn('Failed to fetch Reddit avatar:', error);
    return null;
  }
}

export function RaceCanvas({ track, username, onRunEnd }: Props) {
  const cvsRef = useRef<HTMLCanvasElement>(null);
  const [avatarImage, setAvatarImage] = useState<HTMLImageElement | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 640, height: 480 });

  // Update canvas size to fill viewport
  useEffect(() => {
    const updateSize = () => {
      setCanvasSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Load Reddit avatar when username changes
  useEffect(() => {
    if (!username) return;
    
    fetchRedditAvatar(username).then(avatarUrl => {
      if (avatarUrl) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => setAvatarImage(img);
        img.onerror = () => setAvatarImage(null);
        img.src = avatarUrl;
      }
    });
  }, [username]);

  // game state in refs (avoid React re-renders)
  const stateRef = useRef<GameState>({
    pos: {...(track.center[0] || { x: 0, y: 0 })},
    heading: track.center[0] && track.center[1] ? Math.atan2(
      track.center[1].y - track.center[0].y,
      track.center[1].x - track.center[0].x
    ) : 0,
    speed: 0,
    idxHint: 0,
    keys: { left: false, right: false },
    lastTs: 0,
    timerMs: GAME.TIMER_MS,
    running: true,
    up: 0,
    down: 0,
    distance: 0,
    wallLock: false,
    wallSign: 0,
    relaunchBoostMs: 0,
    laps: 0,
    trackProgress: 0,
    lastFinishLineTime: 0
  });

  // Build pickups from track data
  const pickupsRef = useRef<PickupExt[]>([]);
  
  // Reset game state when component mounts or remounts
  useEffect(() => {
    const initialState = {
      pos: {...(track.center[0] || { x: 0, y: 0 })},
      heading: track.center[0] && track.center[1] ? Math.atan2(
        track.center[1].y - track.center[0].y,
        track.center[1].x - track.center[0].x
      ) : 0,
      speed: 0,
      idxHint: 0,
      keys: { left: false, right: false },
      lastTs: 0,
      timerMs: GAME.TIMER_MS,
      running: true,
      up: 0,
      down: 0,
      distance: 0,
      wallLock: false,
      wallSign: 0 as const,
      relaunchBoostMs: 0,
      laps: 0,
      trackProgress: 0,
      lastFinishLineTime: 0
    };
    
    stateRef.current = initialState;
  }, [track]);
  
  useEffect(() => {
    // Initialize pickups from track data
    const newPickups: PickupExt[] = [];
    
    if (track.pickups) {
      track.pickups.forEach((pickup, i) => {
        newPickups.push({
          id: i,
          p: pickup.p,
          kind: pickup.kind,
          ci: i,
          taken: false
        });
      });
    }
    
    pickupsRef.current = newPickups;
  }, [track]);

  // keyboard + touch input
  useEffect(()=>{
    const s = stateRef.current;
    const onKey = (e:KeyboardEvent, down:boolean)=>{
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') { s.keys.left = down; e.preventDefault(); }
      if (e.key === 'ArrowRight'|| e.key === 'd' || e.key === 'D'){ s.keys.right = down; e.preventDefault(); }
    };
    const kd = (e:KeyboardEvent)=>onKey(e,true);
    const ku = (e:KeyboardEvent)=>onKey(e,false);
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);

    // simple touch zones: left half = left, right half = right
    const onTouch = (e:TouchEvent)=>{
      const rect = cvsRef.current?.getBoundingClientRect();
      if (!rect) return;
      const mid = rect.left + rect.width/2;
      // reset
      s.keys.left = s.keys.right = false;
      for (let i=0;i<e.touches.length;i++){
        const t = e.touches.item(i)!;
        if (t.clientX < mid) s.keys.left = true; else s.keys.right = true;
      }
      e.preventDefault();
    };
    const clearTouch = ()=>{ s.keys.left=false; s.keys.right=false; };
    window.addEventListener('touchstart', onTouch, { passive:false });
    window.addEventListener('touchmove', onTouch, { passive:false });
    window.addEventListener('touchend', clearTouch);
    window.addEventListener('touchcancel', clearTouch);

    return ()=> {
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
      window.removeEventListener('touchstart', onTouch as any);
      window.removeEventListener('touchmove', onTouch as any);
      window.removeEventListener('touchend', clearTouch);
      window.removeEventListener('touchcancel', clearTouch);
    };
  },[]);

  useEffect(()=>{
    const cvs = cvsRef.current!;
    const ctx = cvs.getContext('2d')!;
    const W = canvasSize.width, H = canvasSize.height;
    cvs.width = W;
    cvs.height = H;
    const map = makeWorldToCanvas(track.center, W, H);

    // prebuild road polygon (for draw)
    const left: Vec2[] = [], right: Vec2[] = [];
    for (let i = 0; i < track.center.length; i++) {
      const p = track.center[i];
      const n = track.normals[i];
      const w = track.width[i];
      if (p && n && w !== undefined) {
        const hw = w * 0.5;
        left.push(map({ x: p.x + n.x * hw, y: p.y + n.y * hw }));
        right.push(map({ x: p.x - n.x * hw, y: p.y - n.y * hw }));
      }
    }

    // physics constants (world units per second)
    const ACCEL = PHYSICS.ACCEL;       // forward thrust
    const DRAG = PHYSICS.DRAG;         // baseline drag
    const MAX_V = PHYSICS.MAX_V;       // top speed
    const STEER = PHYSICS.STEER;       // rad/s at full lock
    const OFFROAD_SLOW = PHYSICS.OFFROAD_SLOW; // multiplier when off road
    const WALL_PUSH = 0.6;             // snap back toward edge when far outside

    let raf = 0;

    const drawRoad = () => {
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ctx.fillStyle = COLORS.road;
      ctx.beginPath();
      if (left.length > 0 && left[0]) {
        ctx.moveTo(left[0].x, left[0].y);
        for (let i = 1; i < left.length; i++) {
          const point = left[i];
          if (point) ctx.lineTo(point.x, point.y);
        }
        for (let i = right.length - 1; i >= 0; i--) {
          const point = right[i];
          if (point) ctx.lineTo(point.x, point.y);
        }
      }
      ctx.closePath(); ctx.fill();

      // centerline
      ctx.strokeStyle = COLORS.centerline; ctx.lineWidth = 1.5;
      ctx.beginPath();
      const c0 = track.center[0];
      if (c0) {
        const mappedC0 = map(c0);
        ctx.moveTo(mappedC0.x, mappedC0.y);
        for (let i = 1; i < track.center.length; i++) {
          const center = track.center[i];
          if (center) {
            const c = map(center);
            ctx.lineTo(c.x, c.y);
          }
        }
      }
      ctx.closePath(); ctx.stroke();
    };

    const drawPickups = () => {
      const pickups = pickupsRef.current;
      for (const pickup of pickups) {
        if (pickup.taken) continue;
        
        const mappedPos = map(pickup.p);
        const radius = PICKUP.RADIUS;
        
        ctx.fillStyle = pickup.kind === 'up' ? COLORS.up : COLORS.down;
        ctx.beginPath();
        ctx.arc(mappedPos.x, mappedPos.y, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw arrow symbol
        ctx.fillStyle = 'white';
        ctx.font = '12px system-ui';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(pickup.kind === 'up' ? '↑' : '↓', mappedPos.x, mappedPos.y);
      }
    };

    const drawFinishLine = () => {
      // Draw finish line at the start/end of the track
      if (track.center.length < 2) return;
      
      const startPoint = track.center[0];
      const startNormal = track.normals[0];
      const startWidth = track.width[0];
      
      if (!startPoint || !startNormal || startWidth === undefined) return;
      
      const hw = startWidth * 0.5;
      const left = add(startPoint, mul(startNormal, hw));
      const right = add(startPoint, mul(startNormal, -hw));
      
      const leftMapped = map(left);
      const rightMapped = map(right);
      
      // Draw checkered pattern
      ctx.lineWidth = GAME.FINISH_LINE_WIDTH;
      const segments = 8;
      for (let i = 0; i < segments; i++) {
        const t1 = i / segments;
        const t2 = (i + 1) / segments;
        
        const x1 = leftMapped.x + (rightMapped.x - leftMapped.x) * t1;
        const y1 = leftMapped.y + (rightMapped.y - leftMapped.y) * t1;
        const x2 = leftMapped.x + (rightMapped.x - leftMapped.x) * t2;
        const y2 = leftMapped.y + (rightMapped.y - leftMapped.y) * t2;
        
        ctx.strokeStyle = i % 2 === 0 ? '#000000' : '#FFFFFF';
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    };

    const drawCar = (pos: Vec2, heading: number) => {
      const mappedPos = map(pos);
      const size = CAR.LEN;
      
      if (avatarImage) {
        // Draw Reddit avatar as circular car
        ctx.save();
        ctx.translate(mappedPos.x, mappedPos.y);
        ctx.rotate(heading);
        
        // Create circular clipping mask
        ctx.beginPath();
        ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
        ctx.clip();
        
        // Draw avatar image
        ctx.drawImage(avatarImage, -size / 2, -size / 2, size, size);
        ctx.restore();
        
        // Draw direction indicator
        const indicatorPos = map(add(pos, mul({ x: Math.cos(heading), y: Math.sin(heading) }, size * 0.6)));
        ctx.fillStyle = COLORS.carNose;
        ctx.beginPath();
        ctx.arc(indicatorPos.x, indicatorPos.y, 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Fallback: triangle car
        const L = CAR.LEN, W2 = CAR.HALF_W;
        const f = { x: Math.cos(heading), y: Math.sin(heading) };
        const l = { x: -f.y, y: f.x }; // left
        const p1 = add(pos, mul(f, L));                // nose
        const p2 = add(add(pos, mul(l, W2)), mul(f, -L * 0.6));
        const p3 = add(add(pos, mul(l, -W2)), mul(f, -L * 0.6));
        const P1 = map(p1), P2 = map(p2), P3 = map(p3);

        ctx.fillStyle = COLORS.car;
        ctx.beginPath();
        ctx.moveTo(P1.x, P1.y); ctx.lineTo(P2.x, P2.y); ctx.lineTo(P3.x, P3.y);
        ctx.closePath(); ctx.fill();

        // tiny heading dot
        ctx.fillStyle = COLORS.carNose;
        const nose = map(add(pos, mul(f, L + 1.5)));
        ctx.beginPath(); ctx.arc(nose.x, nose.y, 1.3, 0, Math.PI * 2); ctx.fill();
      }
    };

    const drawHUD = (state: GameState) => {
      ctx.fillStyle = COLORS.hud;
      ctx.font = '16px system-ui';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      
      // Timer
      const timeLeft = Math.max(0, state.timerMs / 1000);
      ctx.fillText(`Time: ${timeLeft.toFixed(1)}s`, 20, 20);
      
      // Score
      ctx.fillText(`↑ ${state.up}  ↓ ${state.down}`, 20, 45);
      
      // Laps
      ctx.fillText(`Laps: ${state.laps}`, 20, 70);
      
      // Speed
      ctx.fillText(`Speed: ${state.speed.toFixed(1)}`, 20, 95);
      
      // Distance
      ctx.fillText(`Distance: ${state.distance.toFixed(0)}m`, 20, 120);
    };

    const checkPickupCollisions = (state: GameState) => {
      const pickups = pickupsRef.current;
      const carRadius = CAR.LEN / 2;
      
      for (const pickup of pickups) {
        if (pickup.taken) continue;
        
        const dist = len(sub(state.pos, pickup.p));
        if (dist < carRadius + PICKUP.RADIUS) {
          pickup.taken = true;
          
          if (pickup.kind === 'up') {
            state.up++;
          } else {
            state.down++;
          }
        }
      }
    };

    const checkFinishLineCrossing = (state: GameState) => {
      // Calculate track progress based on position along the track
      state.trackProgress = state.idxHint / track.center.length;
      
      // Check if we've crossed the finish line (back to start after significant progress)
      if (state.trackProgress < 0.15 && state.trackProgress > 0 && 
          Date.now() - state.lastFinishLineTime > 8000) { // 8 second cooldown for wider track
        
        // Only count as lap completion if we've made significant progress around track
        if (state.distance > track.center.length * 3 * 0.7) { // 70% of track length
          state.laps++;
          state.lastFinishLineTime = Date.now();
          
          // Respawn all pickups
          const pickups = pickupsRef.current;
          for (const pickup of pickups) {
            pickup.taken = false;
          }
          
          console.log(`Lap ${state.laps} completed! Pickups respawned.`);
        }
      }
    };

    const loop = (ts:number)=>{
      const s = stateRef.current;
      if (!s.lastTs) s.lastTs = ts;
      const dt = Math.min((ts - s.lastTs)/1000, 0.033); // clamp
      s.lastTs = ts;

      // Update timer
      if (s.running) {
        s.timerMs -= dt * 1000;
        if (s.timerMs <= 0) {
          s.timerMs = 0;
          s.running = false;
          
          // Call onRunEnd callback
          if (onRunEnd) {
            onRunEnd({
              up: s.up,
              down: s.down,
              timeMs: GAME.TIMER_MS - s.timerMs,
              distance: s.distance
            });
          }
        }
      }

      if (s.running) {
        // ----- physics: forward-only -----
        // thrust & drag
        s.speed += ACCEL * dt;
        s.speed -= DRAG * dt;
        s.speed = clamp(s.speed, 0, MAX_V);

        // steering (more stable if we scale by (0.5 + speed/MAX_V))
        const steerInput = (s.keys.right? 1:0) - (s.keys.left? 1:0);
        s.heading += steerInput * STEER * (0.5 + 0.5*s.speed/MAX_V) * dt;

        // integrate position
        const fwd = v(Math.cos(s.heading), Math.sin(s.heading));
        const oldPos = { ...s.pos };
        s.pos = add(s.pos, mul(fwd, s.speed * dt));
        
        // Update distance
        s.distance += len(sub(s.pos, oldPos));

        // nearest centerline & off-road penalty
        s.idxHint = nearestIndex(track, s.pos, s.idxHint, 35);
        const { offset, half } = signedOffsetFromCenter(track, s.pos, s.idxHint);
        const offAmt = Math.abs(offset) - half;

        if (offAmt > 0) {
          // off road → slow down significantly
          const slowdownFactor = Math.min(1, offAmt / half);
          s.speed *= (1 - (1 - OFFROAD_SLOW) * slowdownFactor);
          
          // Strong wall push-back to prevent crossing track boundaries
          const { offset: currentOffset, half: currentHalf } = signedOffsetFromCenter(track, s.pos, s.idxHint);
          const centerPoint = track.center[s.idxHint];
          const normal = track.normals[s.idxHint];
          if (centerPoint && normal) {
            // If very far off track, snap back more aggressively
            const maxOffroad = currentHalf * 1.2; // Allow slight overhang
            if (Math.abs(currentOffset) > maxOffroad) {
              const targetOffset = Math.sign(currentOffset) * maxOffroad;
              const targetPos = add(centerPoint, mul(normal, targetOffset));
              s.pos = targetPos;
            } else {
              // Gentle push back toward track
              const edge = add(centerPoint, mul(normal, Math.sign(currentOffset) * currentHalf));
              const towardEdge = sub(edge, s.pos);
              s.pos = add(s.pos, mul(towardEdge, WALL_PUSH * dt * 2)); // stronger push
            }
          }
        }

        // Check pickup collisions
        checkPickupCollisions(s);
        
        // Check finish line crossing
        checkFinishLineCrossing(s);
      }

      // ----- draw -----
      ctx.clearRect(0,0,W,H);
      drawRoad();
      drawFinishLine();
      drawPickups();
      drawCar(s.pos, s.heading);
      drawHUD(s);

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return ()=> cancelAnimationFrame(raf);
  }, [track, canvasSize, avatarImage, onRunEnd]);

  return (
    <canvas
      ref={cvsRef}
      width={canvasSize.width}
      height={canvasSize.height}
      style={{ 
        width: '100%', 
        height: '100%', 
        background: COLORS.bg, 
        touchAction: 'none',
        display: 'block'
      }}
    />
  );
}