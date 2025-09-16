import type { Vec2, TrackData } from '../../shared/track/types';

export type GameScreen = 'start' | 'factions' | 'rules' | 'playing' | 'end';

export type Faction = {
  id: string;
  name: string;
  color: string;
  emoji: string;
  description: string;
  totalKarma: number;
};

export type PickupExt = { 
  id: number; 
  p: Vec2; 
  kind: 'up' | 'down'; 
  ci: number; 
  taken: boolean; 
};

export type GameState = {
  pos: Vec2;
  heading: number;
  speed: number;
  idxHint: number;
  keys: { left: boolean; right: boolean };
  lastTs: number;
  timerMs: number;
  running: boolean;
  up: number;
  down: number;
  distance: number;
  wallLock: boolean;
  wallSign: -1 | 0 | 1;
  relaunchBoostMs: number;
  laps: number;
  trackProgress: number;
  lastFinishLineTime: number;
};

export type RaceCanvasProps = {
  track: TrackData;
  width?: number;
  height?: number;
  onRunEnd?: (result: { 
    up: number; 
    down: number; 
    timeMs: number; 
    distance: number; 
  }) => void;
};

export type GameResult = {
  up: number;
  down: number;
  timeMs: number;
  distance: number;
};
