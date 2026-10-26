import { disc, screen } from "./mini-iso";

/** All three stations share the plate's unit: 10 screen px per world unit. */
const U = 10;

export type Flat = [number, number];

const clamp01 = (value: number) => (value < 0 ? 0 : value > 1 ? 1 : value);

/** Progress of `t` through the window `from`..`to`, clamped. */
export const span = (t: number, from: number, to: number) =>
  to === from ? (t >= to ? 1 : 0) : clamp01((t - from) / (to - from));

export const smooth = (value: number) => {
  const x = clamp01(value);
  return x * x * (3 - 2 * x);
};

interface Spring {
  omega: number;
  zeta: number;
}

/** The lever snaps; the balance sways. Both overshoot a little and settle. */
const LEVER: Spring = { omega: 12, zeta: 0.55 };
const BEAM: Spring = { omega: 9, zeta: 0.28 };

/** Unit step response of a damped spring, in seconds. */
const settle = (seconds: number, { omega, zeta }: Spring) => {
  if (seconds <= 0) return 0;
  const root = Math.sqrt(1 - zeta * zeta);
  const damped = omega * root;
  return (
    1 -
    Math.exp(-zeta * omega * seconds) *
      (Math.cos(damped * seconds) + (zeta / root) * Math.sin(damped * seconds))
  );
};

/**
 * A sequence of rests joined by spring responses. Each change starts from the
 * value the previous one settled on, so the pose is a pure function of `t`.
 */
const stepped = (
  t: number,
  duration: number,
  initial: number,
  events: ReadonlyArray<readonly [number, number]>,
  spring: Spring,
) => {
  let value = initial;
  for (const [at, to] of events) {
    if (t < at) break;
    value += (to - value) * settle(((t - at) * duration) / 1000, spring);
  }
  return value;
};

const seconds = (t: number, at: number, duration: number) => ((t - at) * duration) / 1000;

/* ------------------------------------------------------- 01 · take a side */
/**
 * The lever is thrown across the front of the plate: YES sits over the left
 * side, NO over the right. Both ends are the same radius and height, so the
 * tip travels a true arc in the plate's plane.
 */
export const BALLOT_LOOP = 6000;

const BALLOT_PIVOT: Flat = [0, -0.9];
const BALLOT_Z = 2.55;
const BALLOT_R = 3.4;
const BALLOT_YES = Math.atan2(1.4 - BALLOT_PIVOT[1], -2.5 - BALLOT_PIVOT[0]);
const BALLOT_NO = Math.atan2(1.4 - BALLOT_PIVOT[1], 2.5 - BALLOT_PIVOT[0]);

export interface BallotPose {
  /** Where the lever's tip sits, in screen px. */
  tip: Flat;
  litYes: number;
  litNo: number;
}

export function ballotPose(t: number): BallotPose {
  const thrown = stepped(
    t,
    BALLOT_LOOP,
    0,
    [
      [0.1, 1],
      [0.52, 0],
    ],
    LEVER,
  );
  const angle = BALLOT_YES + (BALLOT_NO - BALLOT_YES) * thrown;
  return {
    tip: screen([
      BALLOT_PIVOT[0] + Math.cos(angle) * BALLOT_R,
      BALLOT_PIVOT[1] + Math.sin(angle) * BALLOT_R,
      BALLOT_Z,
    ]),
    litYes: 1 - clamp01(thrown),
    litNo: clamp01(thrown),
  };
}

/* ------------------------------------------------------- 02 · set the price */
/**
 * Two orders on two pans. The beam is a balance, so the heavier side drops:
 * load is ±1 while one pan is empty and 0 when they match. The pans hang from
 * the beam ends and recoil when an order lands or lifts.
 */
export const BEAM_LOOP = 9000;

export const BEAM_MID = 4.35;
export const BEAM_DROP = 0.9;
export const BEAM_HANGER = 1.55;
export const PAN_REF_Z = BEAM_MID - BEAM_HANGER;
export const PAN_PLAN: Flat = [2.3, -2.3];
export const WEIGHT_LIFT = 1.35;

const BEAM_EVENTS = [
  [0.1, -1],
  [0.46, 0],
  [0.7, 1],
  [0.88, 0],
] as const;

/** Damped recoil after an order lands on a pan (seconds since contact). */
const wobble = (since: number) =>
  since <= 0 ? 0 : Math.exp(-7 * since) * Math.sin(18 * since);

export interface BeamSide {
  end: Flat;
  pan: { cx: number; cy: number; rx: number; ry: number };
  rim: { cx: number; cy: number; rx: number; ry: number };
  /** Screen offset of the order's slab from its resting place on the pan. */
  weightDy: number;
  weightOpacity: number;
}

export interface BeamPose {
  tilt: number;
  left: BeamSide;
  right: BeamSide;
}

const fallenOrder = (k: number) => ({
  extra: WEIGHT_LIFT * (1 - k) * (1 - k),
  opacity: smooth(span(k, 0, 0.35)),
});

const liftedOrder = (k: number) => ({
  extra: WEIGHT_LIFT * k * k,
  opacity: 1 - smooth(span(k, 0.4, 1)),
});

function orderAt(t: number, liftFrom: number, liftTo: number, fallFrom: number, fallTo: number) {
  if (t < liftFrom) return { extra: 0, opacity: 1 };
  if (t < liftTo) return liftedOrder(span(t, liftFrom, liftTo));
  if (t < fallFrom) return { extra: WEIGHT_LIFT, opacity: 0 };
  if (t < fallTo) return fallenOrder(span(t, fallFrom, fallTo));
  return { extra: 0, opacity: 1 };
}

export function beamPose(t: number): BeamPose {
  const tilt = Math.max(
    -1.15,
    Math.min(1.15, stepped(t, BEAM_LOOP, 0, BEAM_EVENTS, BEAM)),
  );

  const leftOrder = orderAt(t, 0.1, 0.2, 0.62, 0.7);
  const rightOrder = orderAt(t, 0.46, 0.56, 0.8, 0.88);

  const leftRecoil =
    0.15 * wobble(seconds(t, 0.7, BEAM_LOOP)) - 0.07 * wobble(seconds(t, 0.1, BEAM_LOOP));
  const rightRecoil =
    0.15 * wobble(seconds(t, 0.88, BEAM_LOOP)) - 0.07 * wobble(seconds(t, 0.46, BEAM_LOOP));

  const leftZ = BEAM_MID + BEAM_DROP * tilt - BEAM_HANGER - leftRecoil;
  const rightZ = BEAM_MID - BEAM_DROP * tilt - BEAM_HANGER - rightRecoil;

  return {
    tilt,
    left: {
      end: screen([-PAN_PLAN[0], PAN_PLAN[1], BEAM_MID + BEAM_DROP * tilt]),
      pan: disc(-PAN_PLAN[0], PAN_PLAN[1], leftZ, 1.12),
      rim: disc(-PAN_PLAN[0], PAN_PLAN[1], leftZ, 0.82),
      weightDy: -(leftZ - PAN_REF_Z) * U - leftOrder.extra * U,
      weightOpacity: leftOrder.opacity,
    },
    right: {
      end: screen([PAN_PLAN[0], -PAN_PLAN[1], BEAM_MID - BEAM_DROP * tilt]),
      pan: disc(PAN_PLAN[0], -PAN_PLAN[1], rightZ, 1.12),
      rim: disc(PAN_PLAN[0], -PAN_PLAN[1], rightZ, 0.82),
      weightDy: -(rightZ - PAN_REF_Z) * U - rightOrder.extra * U,
      weightOpacity: rightOrder.opacity,
    },
  };
}

/* ---------------------------------------------------- 03 · collect the answer */
/**
 * The winning share leaves the gate along a true ballistic arc and lands on
 * the stack in the tray. Phase 0 is the paid-out stack, so the loop closes:
 * clear the paid coin, send the next one out, land, settle.
 */
export const PAYOUT_LOOP = 7000;

export const PAYOUT_SLOT: [number, number, number] = [2.4, -0.7, 1.78];
export const PAYOUT_LAND: [number, number, number] = [-2.3, 1.3, 1.98];
export const PAYOUT_REST = screen(PAYOUT_LAND);

const PAYOUT_RISE = 1.7;

const arc = (s: number): Flat =>
  screen([
    PAYOUT_SLOT[0] + (PAYOUT_LAND[0] - PAYOUT_SLOT[0]) * s,
    PAYOUT_SLOT[1] + (PAYOUT_LAND[1] - PAYOUT_SLOT[1]) * s,
    PAYOUT_SLOT[2] + (PAYOUT_LAND[2] - PAYOUT_SLOT[2]) * s + 4 * PAYOUT_RISE * s * (1 - s),
  ]);

const TRAIL_STEPS = 64;
export const PAYOUT_TRAIL = Array.from({ length: TRAIL_STEPS + 1 }, (_, index) =>
  arc(index / TRAIL_STEPS),
)
  .map(([x, y], index) => `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`)
  .join("");

export interface PayoutPose {
  coin: Flat;
  opacity: number;
  /** Fraction of the arc already flown, 0..1. */
  trail: number;
  trailOpacity: number;
}

export const PAYOUT_STILL = 0.32;

export function payoutPose(t: number): PayoutPose {
  if (t < 0.06) {
    const cleared = smooth(span(t, 0.02, 0.06));
    return { coin: arc(1), opacity: 1 - cleared, trail: 1, trailOpacity: 1 - cleared };
  }
  if (t < 0.1) {
    return { coin: arc(0), opacity: smooth(span(t, 0.06, 0.1)), trail: 0, trailOpacity: 0 };
  }
  if (t < 0.5) {
    const flown = span(t, 0.1, 0.5);
    return { coin: arc(flown), opacity: 1, trail: flown, trailOpacity: 1 };
  }
  return { coin: arc(1), opacity: 1, trail: 1, trailOpacity: 1 };
}
