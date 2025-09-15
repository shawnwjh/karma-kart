export const COLORS = {
  bg: '#1a1a1a',
  road: '#3b3b3b',
  centerline: 'rgba(255,255,255,0.18)',
  hud: 'rgba(255,255,255,0.9)',
  car: '#ff5700',
  carNose: '#FFFFFF',
  up: '#4CAF50',
  down: '#E53935',
};

export const PHYSICS = {
  ACCEL: 32,              // forward thrust
  DRAG: 12,               // baseline drag
  MAX_V: 85,              // top speed
  STEER: 2.8,             // rad/s at full lock
  OFFROAD_SLOW: 0.25,     // stronger penalty when off-road (was 0.55)

  // wall behaviour
  COLLIDE_EPS: 0.8,       // push inside lane after clamp
  WALL_RELAUNCH_SPEED: 42,
  RELAUNCH_BOOST_MS: 240,
  RELAUNCH_THRUST_MULT: 3.0,
  RELAUNCH_DRAG_MULT: 0.5,
  RELAUNCH_MIN_SPEED: 34,
};

export const CAR = {
  LEN: 34,               // made even bigger for profile picture
  HALF_W: 28,            // increased proportionally
};

export const PICKUP = {
  RADIUS: 3.2,           // collision detection radius
  IMAGE_SIZE: 16,        // size for rendering pickup images (pixels)
};

export const TRACK = {
  BASE_WIDTH: 50,        // increased from 35 for wider track
  WIDTH_AMP: 10,         // increased from 8 for more width variation
  RADIUS: 220,           // slightly increased from 200 for smoother curves
  SPACING: 2,            // tighter spacing for smoother curves (from 3)
  CONTROL_POINTS: 8,     // fewer control points for smoother track (from 16-23)
  JITTER: 0.1,           // less angular jitter for smoother curves (from 0.3)
  RADIUS_VARIATION: 0.2, // less radius variation for consistent curves (from 0.4)
};

export const CANVAS = {
  DEFAULT_WIDTH: 640,
  DEFAULT_HEIGHT: 480,
  PADDING: 24,
};

export const GAME = {
  TIMER_MS: 30_000,
  SEARCH_WINDOW: 40,
  FINISH_LINE_WIDTH: 4,
  FINISH_LINE_PROGRESS_THRESHOLD: 0.95, // Must complete 95% of track to cross finish line
};
