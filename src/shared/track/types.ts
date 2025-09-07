export type Vec2 = { x: number; y: number };

export interface TrackData {
  center: Vec2[];        // resampled closed polyline
  normals: Vec2[];       // unit normals per point (pointing left of forward)
  width: number[];       // meters; half-width is width[i] / 2
  pickups: { p: Vec2; kind: 'up' | 'down' }[];
  seed: string;
}