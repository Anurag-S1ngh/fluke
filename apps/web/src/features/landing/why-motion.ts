/**
 * One 12-second cycle for the three "Why prices" plates.
 *
 * Each mechanism runs a complete, closed cycle on the same clock, so the
 * section beats as one instrument: the press strikes, the counter reaches its
 * high price and the stamp lands within a second of each other. Every pose is
 * a pure function of the phase; the figures paint the result through refs.
 *
 * 0.00  all three at rest
 * 0.40  the press strikes and the stamp lands (Fig 01 / Fig 03)
 * 0.42  the counter reaches 71 (Fig 02)
 * 0.72  the press has reset and filed its slip
 * 0.86  the counter is back at 64 and the stamp is re-inking
 */

export const WHY_LOOP = 12000;

export type Point3 = [number, number, number];
export type Flat = [number, number];

const clamp01 = (value: number) => (value < 0 ? 0 : value > 1 ? 1 : value);

/** Progress of `t` through the window `from`..`to`, clamped. */
export const span = (t: number, from: number, to: number) =>
  to === from ? (t >= to ? 1 : 0) : clamp01((t - from) / (to - from));

export const smooth = (value: number) => {
  const x = clamp01(value);
  return x * x * (3 - 2 * x);
};

const lerp3 = (a: Point3, b: Point3, t: number): Point3 => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];

const wrap01 = (value: number) => value - Math.floor(value);

/* ------------------------------------------------ 01 · skin in the game */
/**
 * A coin-operated stamp press. The coin arrives on the chute, seats in the cup
 * and arms the press; the hand wheel turns one revolution, the die prints the
 * claim on the paper tape, the coin drops into the drawer, the tape indexes
 * one section and the next blank section is waiting. The tape's holes repeat
 * exactly eight times across the feed, so the reset at the seam is invisible.
 */
export const STAKE = {
  platen: { x: -2.55, y: -2.4, w: 4.1, d: 4.15, h: 0.9 },
  paper: { x0: -2.1, x1: 1.35, y0: -1.35, y1: 0.75, z: 1.77 },
  paperHolePitch: 0.325,
  /** The tape moves eight hole pitches per cycle. */
  paperFeed: 2.6,
  die: { x: 0, y: -0.9 },
  pressTravel: 0.5,
  wheel: { x: 0.05, y: -1.55, z: 6.12, r: 0.82 },
  coinStart: [3, -0.55, 2.9] as Point3,
  coinRampEnd: [1.5, 1.05, 2.35] as Point3,
  coinCup: [1, 1.22, 1.8] as Point3,
  coinRadius: 0.42,
  cup: { x: 1, y: 1.22, r: 0.5 },
  drawer: { x: 0, y: 1.75, w: 1.45, z0: 0.88, z1: 1.55 },
  chuteFoot: { x: 3.05, y: 1.15 },
  /** Left edge of the printed block on the tape before any feed. */
  printX0: -0.5,
  printWidth: 1,
} as const;

export interface StakePose {
  /** Centre of the coin, in world units. */
  coin: Point3;
  coinOpacity: number;
  /** Radians turned by the hand wheel. */
  wheel: number;
  /** 0..1 of the press travel. */
  ram: number;
  /** 0..1 of the tape feed. */
  feed: number;
  markOpacity: number;
  /** The coin is in the cup and the press is armed. */
  armed: number;
  /** Impact flash at the die. */
  flash: number;
}

export const STAKE_STILL = 0.405;

export function stakePose(phase: number): StakePose {
  const t = wrap01(phase);

  const ramp = smooth(span(t, 0.03, 0.13));
  const ontoCup = smooth(span(t, 0.13, 0.18));
  const falling = smooth(span(t, 0.52, 0.6));

  let coin: Point3 = lerp3(STAKE.coinStart, STAKE.coinRampEnd, ramp);
  if (ontoCup > 0) {
    coin = lerp3(coin, STAKE.coinCup, ontoCup);
  }
  if (falling > 0) {
    coin = [STAKE.coinCup[0], STAKE.coinCup[1], STAKE.coinCup[2] - 1.0 * falling];
  }

  const coinOpacity = t < 0.02 || t > 0.6 ? 0 : 1 - smooth(span(t, 0.545, 0.595));

  const wheel = Math.PI * 2 * smooth(span(t, 0.22, 0.56));
  const ram = smooth(span(t, 0.27, 0.4)) * (1 - smooth(span(t, 0.42, 0.54)));
  const feed = t < 0.72 ? smooth(span(t, 0.52, 0.72)) : 0;

  const printed = t >= 0.4 && t < 0.74;
  const markOpacity = printed
    ? smooth(span(t, 0.4, 0.42)) * (1 - smooth(span(feed, 0.88, 0.98)))
    : 0;

  const armed = smooth(span(t, 0.17, 0.24)) * (1 - smooth(span(t, 0.52, 0.58)));

  const flash =
    t < 0.39 ? 0 : Math.exp(-Math.max(0, t - 0.4) / 0.045) * smooth(span(t, 0.395, 0.41));

  return { coin, coinOpacity, wheel, ram, feed, markOpacity, armed, flash };
}

/* ------------------------------------------------------- 02 · one number */
/**
 * A price counter. A radial cam on the plate lifts a rod; the rod rocks the
 * bell crank on the cabinet and the two odometer drums roll from 64 up to 71
 * and back. The tens drum carries once, as the units pass 69 -> 70, so the
 * number is always produced by the same mechanism.
 */
export const COUNTER = {
  faceY: -0.18,
  window: { x0: -1.42, x1: 1.42, z0: 2.15, z1: 3.72 },
  cellHeight: 1.57,
  unitDigits: [4, 5, 6, 7, 8, 9, 0, 1] as const,
  tenDigits: [6, 7] as const,
  digit: { tensX: -0.77, unitsX: 0.77, width: 0.62, height: 0.98 },
  cam: { x: 2.55, y: -1.15, z: 2.2, base: 0.46, amp: 0.24, steps: 48 },
  lever: { pivotX: 1.75, pivotZ: 2.55, x: 2.55, y: -1.15, z: 2.9, lift: 0.4 },
} as const;

export interface CounterPose {
  /** 64 .. 71. */
  price: number;
  /** 0..1 of the rise, used by the cam and the bell crank. */
  travel: number;
  /** Continuous phase of the cam, in radians. */
  camAngle: number;
  /** Radius of the cam where the follower rides, top of the disc. */
  camTop: number;
  unitsOffset: number;
  tensOffset: number;
}

export const COUNTER_STILL = 0.5;

/**
 * The cam's material profile: its radius at a phase of the cycle. A quick rise,
 * a dwell at 71, a quick fall and a longer dwell at 64 keep the number readable
 * instead of parked between two digits for most of the loop.
 */
const counterTravelAt = (u: number) =>
  smooth(span(u, 0.12, 0.26)) * (1 - smooth(span(u, 0.6, 0.74)));

/** Radius of the cam at a screen-plane angle, for the current rotation. */
export function counterCamRadius(angle: number, phase: number) {
  const u = wrap01((angle / (Math.PI * 2) + phase) % 1);
  return COUNTER.cam.base + COUNTER.cam.amp * counterTravelAt(u);
}

export function counterPose(phase: number): CounterPose {
  const t = wrap01(phase);
  const travel = counterTravelAt(t);
  const price = 64 + 7 * travel;
  const camAngle = Math.PI * 2 * t;
  return {
    price,
    travel,
    camAngle,
    camTop: COUNTER.cam.base + COUNTER.cam.amp * travel,
    unitsOffset: price - 64,
    tensOffset: Math.max(0, Math.min(1, price - 69)),
  };
}

/* ------------------------------------------------- 03 · settled in public */
/**
 * The notice board. A rack-and-pinion carriage carries a self-inking stamp
 * along the top rail; it trips over the posted sheet, prints it, lifts, and
 * the sheet is released through the slot at the foot of the board while the
 * next blank sheet rises. The stamp then returns to the ink tray.
 */
export const NOTICE = {
  faceY: -1.64,
  sheet: { x0: -1.85, x1: 1.55, z0: 3.25, z1: 4.6 },
  rail: { x0: -2.45, x1: 2.45, y: -1.55, z0: 4.86, z1: 5.0 },
  parkX: 1.95,
  stampX: 0,
  headTravel: 0.28,
  sheetDrop: 1.9,
  inkTray: { x0: 1.85, x1: 2.55, y0: -1.95, y1: -1.35, top: 4.28 },
} as const;

export interface NoticePose {
  carX: number;
  /** 0..1 of the head travel. */
  headDrop: number;
  markOpacity: number;
  /** World z offset of the filing sheet. */
  sheetDrop: number;
  /** World z offset of the fresh sheet, from below its pinned place. */
  freshDrop: number;
  /** 0..1 of the clip bar lift. */
  clip: number;
  /** Ring pulse when the head re-inks. */
  ink: number;
  /** 0..1 of the trip arm's throw. */
  trip: number;
}

export const NOTICE_STILL = 0.5;

export function noticePose(phase: number): NoticePose {
  const t = wrap01(phase);
  const out = smooth(span(t, 0.12, 0.36));
  const back = smooth(span(t, 0.68, 0.88));
  const carX = NOTICE.parkX + (NOTICE.stampX - NOTICE.parkX) * (out - back);

  const press = smooth(span(t, 0.36, 0.41)) * (1 - smooth(span(t, 0.43, 0.48)));
  const ink = 0.24 * smooth(span(t, 0.9, 0.94)) * (1 - smooth(span(t, 0.95, 0.99)));
  const headDrop = Math.max(press, ink);

  const markOpacity = t >= 0.4 && t < 0.74 ? smooth(span(t, 0.4, 0.42)) : 0;
  const sheetDrop = -NOTICE.sheetDrop * smooth(span(t, 0.56, 0.7));
  const freshDrop = -NOTICE.sheetDrop * (1 - smooth(span(t, 0.5, 0.58)));
  const clip = smooth(span(t, 0.54, 0.6)) * (1 - smooth(span(t, 0.78, 0.84)));
  const trip = smooth(span(t, 0.34, 0.38)) * (1 - smooth(span(t, 0.46, 0.5)));
  const inkPulse = Math.sin(Math.PI * span(t, 0.9, 0.99));

  return {
    carX,
    headDrop,
    markOpacity,
    sheetDrop,
    freshDrop,
    clip,
    ink: inkPulse,
    trip,
  };
}
