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
  LEN: 28,               // made even bigger for profile picture
  HALF_W: 18,            // increased proportionally
};

export const PICKUP = {
  RADIUS: 3.2,
};

export const CANVAS = {
  DEFAULT_WIDTH: 640,
  DEFAULT_HEIGHT: 480,
  PADDING: 24,
};

export const GAME = {
  TIMER_MS: 60_000,
  SEARCH_WINDOW: 40,
  FINISH_LINE_WIDTH: 4,
  FINISH_LINE_PROGRESS_THRESHOLD: 0.95, // Must complete 95% of track to cross finish line
};
