"use client";

import type * as React from "react";

import { Coin, disc, flat, ISO_VIEWBOX, Plate, screen, Slab, type Point } from "./mini-iso";
import { usePlateLoop } from "./plate-loop";
import {
  COUNTER,
  COUNTER_STILL,
  counterCamRadius,
  counterPose,
  NOTICE,
  NOTICE_STILL,
  noticePose,
  TURNSTILE,
  TURNSTILE_STILL,
  turnstilePose,
  WHY_LOOP,
} from "./why-motion";

/** Screen offset of a world move: the plate draws 10 px to the unit. */
const shift = ([dx, dy, dz]: Point): [number, number] => [
  (dx - dy) * 8.660254,
  (dx + dy) * 5 - dz * 10,
];

const n = (value: number) => (Math.round(value * 100) / 100).toString();

/** A rectangle standing in a face at a fixed y. */
const faceRect = (x0: number, z0: number, x1: number, z1: number, y: number) =>
  flat([
    [x0, y, z0],
    [x1, y, z0],
    [x1, y, z1],
    [x0, y, z1],
  ]);

/** A rectangle lying on a horizontal plane at a fixed z. */
const topRect = (x0: number, y0: number, x1: number, y1: number, z: number) =>
  flat([
    [x0, y0, z],
    [x1, y0, z],
    [x1, y1, z],
    [x0, y1, z],
  ]);

/** A rectangle standing in a side face at a fixed x. */
const sideRect = (y0: number, z0: number, y1: number, z1: number, x: number) =>
  flat([
    [x, y0, z0],
    [x, y1, z0],
    [x, y1, z1],
    [x, y0, z1],
  ]);

/** The machined trim every plate carries: a rooted ruler and a label plate. */
function PlateTrim({ label = true }: { label?: boolean }) {
  const ticks: React.ReactNode[] = [];
  for (let x = -3; x <= 3.05; x += 0.4) {
    const major = Math.round((x + 3) / 0.4) % 4 === 0;
    ticks.push(
      <line
        key={x}
        x1={screen([x, 2.99, 0.835])[0]}
        y1={screen([x, 2.99, 0.835])[1]}
        x2={screen([x, major ? 3.15 : 3.1, 0.835])[0]}
        y2={screen([x, major ? 3.15 : 3.1, 0.835])[1]}
        className={major ? "stroke-foreground/60" : "stroke-foreground/30"}
        strokeWidth={0.7}
      />,
    );
  }

  return (
    <>
      <Slab x={-3.2} y={2.9} z={0.8} w={6.4} d={0.3} h={0.03} />
      {ticks}
      {label && (
        <>
          <Slab x={-3.3} y={1.7} z={0.8} w={1.35} d={0.85} h={0.04} />
          <polygon
            points={topRect(-3.24, 1.76, -2.01, 2.49, 0.851)}
            className="fill-none stroke-foreground/30"
            strokeWidth={0.7}
          />
          {[2.36, 2.15, 1.94].map((y, index) => (
            <line
              key={y}
              x1={screen([-3.14, y, 0.852])[0]}
              y1={screen([-3.14, y, 0.852])[1]}
              x2={screen([index === 2 ? -2.55 : -2.2, y, 0.852])[0]}
              y2={screen([index === 2 ? -2.55 : -2.2, y, 0.852])[1]}
              className="stroke-foreground/40"
              strokeWidth={0.7}
            />
          ))}
          {(
            [
              [-3.16, 1.84],
              [-2.09, 2.41],
            ] as const
          ).map(([x, y]) => (
            <ellipse
              key={`${x}-${y}`}
              {...disc(x, y, 0.853, 0.075)}
              className="fill-foreground/35"
            />
          ))}
        </>
      )}
    </>
  );
}

/* ------------------------------------------------ 01 · skin in the game */

interface ArmFaces {
  sideA: string;
  sideB: string;
  end: string;
  top: string;
}

/** One arm of the gate as four projected faces, rebuilt for its angle. */
function armFaces(angle: number): ArmFaces {
  const { inner, outer, half, z0, z1 } = TURNSTILE.arms;
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  const px = -Math.sin(angle) * half;
  const py = Math.cos(angle) * half;
  const top = (r: number, side: number): Point => [dx * r + px * side, dy * r + py * side, z1];
  const bottom = (r: number, side: number): Point => [dx * r + px * side, dy * r + py * side, z0];
  const ti = top(inner, 1);
  const to = top(outer, 1);
  const uo = top(outer, -1);
  const ui = top(inner, -1);
  const bi = bottom(inner, 1);
  const bo = bottom(outer, 1);
  const ubo = bottom(outer, -1);
  const ubi = bottom(inner, -1);
  return {
    sideA: flat([ti, to, bo, bi]),
    sideB: flat([ui, uo, ubo, ubi]),
    end: flat([to, uo, ubo, bo]),
    top: flat([ti, to, uo, ui]),
  };
}

const ARM_REST = [0, 1, 2, 3].map((index) => armFaces((index * Math.PI) / 2));
const BUCKET_CENTRES = [0, 1, 2, 3].map((index) => {
  const angle = Math.PI / 4 + (index * Math.PI) / 2;
  return [
    Math.cos(angle) * TURNSTILE.bucketRadius,
    Math.sin(angle) * TURNSTILE.bucketRadius,
  ] as const;
});
const COIN_REST = screen([BUCKET_CENTRES[0][0], BUCKET_CENTRES[0][1], TURNSTILE.coinCupZ]);
const TICKS = Array.from({ length: 12 }, (_, index) => (index * Math.PI) / 6);

/** The chute from the coin post to the front bucket. */
const CHUTE_START: Point = [2.45, 0.55, 1.98];
const CHUTE_END: Point = [0.62, 0.58, 1.8];
const CHUTE_LEN = Math.hypot(CHUTE_END[0] - CHUTE_START[0], CHUTE_END[1] - CHUTE_START[1]);
const CHUTE_NEAR = [
  ((CHUTE_END[1] - CHUTE_START[1]) / CHUTE_LEN) * 0.34,
  (-(CHUTE_END[0] - CHUTE_START[0]) / CHUTE_LEN) * 0.34,
] as const;
const CHUTE_FAR = [-CHUTE_NEAR[0], -CHUTE_NEAR[1]] as const;
const CHUTE_FLOOR = flat([
  [CHUTE_START[0] + CHUTE_FAR[0], CHUTE_START[1] + CHUTE_FAR[1], CHUTE_START[2]],
  [CHUTE_END[0] + CHUTE_FAR[0], CHUTE_END[1] + CHUTE_FAR[1], CHUTE_END[2]],
  [CHUTE_END[0] + CHUTE_NEAR[0], CHUTE_END[1] + CHUTE_NEAR[1], CHUTE_END[2]],
  [CHUTE_START[0] + CHUTE_NEAR[0], CHUTE_START[1] + CHUTE_NEAR[1], CHUTE_START[2]],
]);
const chuteWall = (offset: readonly [number, number]) =>
  flat([
    [CHUTE_START[0] + offset[0], CHUTE_START[1] + offset[1], CHUTE_START[2]],
    [CHUTE_END[0] + offset[0], CHUTE_END[1] + offset[1], CHUTE_END[2]],
    [CHUTE_END[0] + offset[0], CHUTE_END[1] + offset[1], CHUTE_END[2] + 0.15],
    [CHUTE_START[0] + offset[0], CHUTE_START[1] + offset[1], CHUTE_START[2] + 0.15],
  ]);

const BALLOT_REST = { x0: -2.65, x1: -2.05, y0: 1.95, y1: 2.65, y: 2.3, z: 1.56 };
const BALLOT_CLIP = flat([
  [-3.1, 1.52, 1.81],
  [-1.6, 1.42, BALLOT_REST.z],
  [-1.6, 3.4, BALLOT_REST.z],
  [-3.1, 3.4, BALLOT_REST.z],
]);

const PLATE_TOP = disc(0, 0, 1.52, 0.95);
const PLATE_BOTTOM = disc(0, 0, 1.42, 0.95);

/** A coin-operated gate: say what you like, the gate only moves for money. */
export function TurnstileArt() {
  const rest = turnstilePose(0);
  const restBallot = shift([0, rest.ballot[1] - BALLOT_REST.y, rest.ballot[2] - BALLOT_REST.z]);

  const loop = usePlateLoop(WHY_LOOP, TURNSTILE_STILL, (root) => {
    const arms = [...root.querySelectorAll<SVGGElement>("[data-turn-arm]")];
    const buckets = [...root.querySelectorAll<SVGGElement>("[data-turn-bucket]")];
    const ticks = [...root.querySelectorAll<SVGLineElement>("[data-turn-tick]")];
    const coin = root.querySelector<SVGGElement>("[data-turn-coin]");
    const ballot = root.querySelector<SVGGElement>("[data-turn-ballot]");
    const lamp = root.querySelector<SVGPolygonElement>("[data-turn-lamp]");
    const pawl = root.querySelector<SVGGElement>("[data-turn-pawl]");
    if (
      arms.length !== 4 ||
      buckets.length !== 4 ||
      ticks.length !== 12 ||
      !coin ||
      !ballot ||
      !lamp ||
      !pawl
    ) {
      return () => {};
    }

    return (phase) => {
      const pose = turnstilePose(phase);

      arms.forEach((group, index) => {
        const faces = armFaces(pose.angle + (index * Math.PI) / 2);
        const parts = group.querySelectorAll<SVGPolygonElement>("polygon");
        const values = [faces.sideA, faces.sideB, faces.end, faces.top];
        parts.forEach((part, partIndex) => {
          const points = values[partIndex];
          if (points) part.setAttribute("points", points);
        });
      });

      buckets.forEach((group, index) => {
        const angle = TURNSTILE.bucketStart + pose.angle + (index * Math.PI) / 2;
        const cx = screen([
          Math.cos(angle) * TURNSTILE.bucketRadius,
          Math.sin(angle) * TURNSTILE.bucketRadius,
          1.55,
        ])[0];
        const cy = screen([
          Math.cos(angle) * TURNSTILE.bucketRadius,
          Math.sin(angle) * TURNSTILE.bucketRadius,
          1.55,
        ])[1];
        const ellipses = group.querySelectorAll<SVGEllipseElement>("ellipse");
        ellipses.forEach((ellipse) => {
          ellipse.setAttribute("cx", n(cx));
          ellipse.setAttribute("cy", n(cy));
        });
      });

      ticks.forEach((tick, index) => {
        const angle = pose.angle + (index * Math.PI) / 6;
        const inner = screen([Math.cos(angle) * 0.84, Math.sin(angle) * 0.84, 1.526]);
        const outer = screen([Math.cos(angle) * 0.93, Math.sin(angle) * 0.93, 1.526]);
        tick.setAttribute("x1", n(inner[0]));
        tick.setAttribute("y1", n(inner[1]));
        tick.setAttribute("x2", n(outer[0]));
        tick.setAttribute("y2", n(outer[1]));
      });

      const at = screen(pose.coin);
      coin.setAttribute(
        "transform",
        `translate(${n(at[0] - COIN_REST[0])} ${n(at[1] - COIN_REST[1])})`,
      );
      coin.setAttribute("opacity", n(pose.coinOpacity));

      const ballotAt = shift([0, pose.ballot[1] - BALLOT_REST.y, pose.ballot[2] - BALLOT_REST.z]);
      ballot.setAttribute("transform", `translate(${n(ballotAt[0])} ${n(ballotAt[1])})`);
      ballot.setAttribute("opacity", n(pose.ballotOpacity));

      lamp.setAttribute("opacity", n(pose.armed));
      pawl.setAttribute("transform", `translate(0 ${n(pose.pawl * 1.5)})`);
    };
  });

  return (
    <svg
      ref={loop}
      viewBox={ISO_VIEWBOX}
      className="w-full"
      role="presentation"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <clipPath id="turn-ballot-clip">
          <polygon points={BALLOT_CLIP} />
        </clipPath>
      </defs>

      <Plate />
      <PlateTrim label={false} />

      {/* the poll box: a ballot goes in and nothing else happens */}
      <Slab x={-3} y={1.15} z={0.8} w={1.3} d={1.4} h={0.75} />
      <polygon
        points={topRect(-2.9, 1.25, -1.8, 2.45, 1.551)}
        className="fill-none stroke-foreground/20"
        strokeWidth={0.7}
      />
      <polygon points={topRect(-2.75, 1.3, -1.95, 1.42, 1.552)} className="fill-foreground/70" />
      <polygon
        points={faceRect(-2.8, 0.95, -1.9, 1.25, 2.56)}
        className="fill-background stroke-foreground/35"
        strokeWidth={0.8}
      />
      {[1.19, 1.04].map((z, index) => (
        <line
          key={z}
          x1={screen([-2.7, 2.561, z])[0]}
          y1={screen([-2.7, 2.561, z])[1]}
          x2={screen([index === 1 ? -2.4 : -2.02, 2.561, z])[0]}
          y2={screen([index === 1 ? -2.4 : -2.02, 2.561, z])[1]}
          className="stroke-foreground/35"
          strokeWidth={0.7}
        />
      ))}
      {(
        [
          [-2.88, 2.56],
          [-1.82, 2.56],
        ] as const
      ).map(([x, y]) => (
        <ellipse key={`${x}-${y}`} {...disc(x, y, 1.255, 0.06)} className="fill-foreground/30" />
      ))}

      {/* the ballot: lands on the box, then slides away under the lip */}
      <g clipPath="url(#turn-ballot-clip)">
        <g
          data-turn-ballot
          opacity={rest.ballotOpacity}
          transform={`translate(${n(restBallot[0])} ${n(restBallot[1])})`}
        >
          <polygon
            points={topRect(
              BALLOT_REST.x0,
              BALLOT_REST.y0,
              BALLOT_REST.x1,
              BALLOT_REST.y1,
              BALLOT_REST.z,
            )}
            className="fill-background stroke-foreground"
            strokeWidth={0.9}
          />
          <line
            x1={screen([-2.52, 2.47, 1.562])[0]}
            y1={screen([-2.52, 2.47, 1.562])[1]}
            x2={screen([-2.16, 2.47, 1.562])[0]}
            y2={screen([-2.16, 2.47, 1.562])[1]}
            className="stroke-foreground/40"
            strokeWidth={0.8}
          />
          <polyline
            points={flat([
              [-2.5, 2.14, 1.562],
              [-2.39, 2.26, 1.562],
              [-2.18, 2.02, 1.562],
            ])}
            className="fill-none stroke-foreground"
            strokeWidth={1.4}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <line
            x1={screen([-2.52, 2.32, 1.562])[0]}
            y1={screen([-2.52, 2.32, 1.562])[1]}
            x2={screen([-2.3, 2.32, 1.562])[0]}
            y2={screen([-2.3, 2.32, 1.562])[1]}
            className="stroke-foreground/30"
            strokeWidth={0.7}
          />
        </g>
      </g>
      <Slab x={-2.85} y={1.42} z={1.565} w={1} d={0.1} h={0.085} />

      {/* the base, the rotor shaft and the vault */}
      <Slab x={-1.15} y={-1.15} z={0.8} w={2.3} d={2.3} h={0.52} />
      <Slab x={-1.05} y={-1.05} z={1.32} w={2.1} d={2.1} h={0.06} />
      {(
        [
          [-0.94, -0.94],
          [0.94, -0.94],
          [-0.94, 0.94],
          [0.94, 0.94],
        ] as const
      ).map(([x, y]) => (
        <ellipse key={`${x}-${y}`} {...disc(x, y, 1.385, 0.07)} className="fill-foreground/35" />
      ))}
      <polygon
        points={faceRect(-0.55, 0.85, 0.55, 1.2, 1.156)}
        className="fill-foreground/[0.06] stroke-foreground"
        strokeWidth={0.9}
      />
      <polygon
        points={faceRect(-0.49, 0.89, 0.49, 1.16, 1.157)}
        className="fill-none stroke-foreground/30"
        strokeWidth={0.7}
      />
      <line
        x1={screen([-0.55, 1.157, 0.85])[0]}
        y1={screen([-0.55, 1.157, 0.85])[1]}
        x2={screen([-0.55, 1.157, 1.2])[0]}
        y2={screen([-0.55, 1.157, 1.2])[1]}
        className="stroke-foreground/60"
        strokeWidth={0.8}
      />
      <polygon points={faceRect(0.3, 0.98, 0.46, 1.1, 1.158)} className="fill-foreground" />
      <polyline
        points={flat([
          [0.32, 1.158, 1.1],
          [0.32, 1.158, 1.15],
          [0.44, 1.158, 1.15],
          [0.44, 1.158, 1.1],
        ])}
        className="fill-none stroke-foreground"
        strokeWidth={1.1}
      />
      <circle
        cx={screen([0.38, 1.159, 1.04])[0]}
        cy={screen([0.38, 1.159, 1.04])[1]}
        r={1.2}
        className="fill-background stroke-foreground"
        strokeWidth={0.7}
      />

      <Slab x={-0.14} y={-0.14} z={1.38} w={0.28} d={0.28} h={0.76} />
      <Slab x={-0.2} y={-0.2} z={1.38} w={0.4} d={0.4} h={0.12} />

      {/* the rotor plate */}
      <ellipse
        {...PLATE_BOTTOM}
        className="fill-foreground/20 stroke-foreground/40"
        strokeWidth={0.7}
      />
      <rect
        x={PLATE_TOP.cx - PLATE_TOP.rx}
        y={PLATE_TOP.cy}
        width={PLATE_TOP.rx * 2}
        height={1}
        className="fill-foreground/15"
      />
      <ellipse {...PLATE_TOP} className="fill-background stroke-foreground" strokeWidth={1} />
      {TICKS.map((angle, index) => {
        const inner = screen([Math.cos(angle) * 0.84, Math.sin(angle) * 0.84, 1.526]);
        const outer = screen([Math.cos(angle) * 0.93, Math.sin(angle) * 0.93, 1.526]);
        return (
          <line
            key={index}
            data-turn-tick
            x1={inner[0]}
            y1={inner[1]}
            x2={outer[0]}
            y2={outer[1]}
            className="stroke-foreground/30"
            strokeWidth={0.7}
          />
        );
      })}

      {/* four buckets: the coin's weight turns the gate */}
      {BUCKET_CENTRES.map(([x, y], index) => (
        <g key={index} data-turn-bucket>
          <ellipse {...disc(x, y, 1.525, 0.22)} className="fill-foreground/70" />
          <ellipse
            {...disc(x, y, 1.55, 0.3)}
            className="fill-none stroke-foreground"
            strokeWidth={0.9}
          />
          <ellipse
            {...disc(x, y, 1.56, 0.33)}
            className="fill-none stroke-foreground/25"
            strokeWidth={0.6}
          />
        </g>
      ))}

      {/* the coin post and its chute to the front bucket */}
      <Slab x={2.15} y={0.1} z={0.8} w={0.3} d={0.3} h={1.3} />
      <Slab x={2.3} y={0.4} z={1.9} w={0.3} d={0.22} h={0.09} />
      <polygon
        points={faceRect(2.19, 1.5, 2.41, 1.68, 0.401)}
        className="fill-background stroke-foreground"
        strokeWidth={0.8}
      />
      <polygon
        data-turn-lamp
        points={faceRect(2.23, 1.55, 2.37, 1.64, 0.402)}
        opacity={rest.armed}
        className="fill-signal"
      />

      <polygon points={CHUTE_FLOOR} className="fill-foreground/[0.1]" />
      <polygon
        points={chuteWall(CHUTE_FAR)}
        className="fill-foreground/[0.14] stroke-foreground"
        strokeWidth={0.8}
        strokeLinejoin="round"
      />
      <line
        x1={screen([CHUTE_END[0] + CHUTE_NEAR[0], CHUTE_END[1] + CHUTE_NEAR[1], CHUTE_END[2]])[0]}
        y1={screen([CHUTE_END[0] + CHUTE_NEAR[0], CHUTE_END[1] + CHUTE_NEAR[1], CHUTE_END[2]])[1]}
        x2={screen([CHUTE_END[0] + CHUTE_FAR[0], CHUTE_END[1] + CHUTE_FAR[1], CHUTE_END[2]])[0]}
        y2={screen([CHUTE_END[0] + CHUTE_FAR[0], CHUTE_END[1] + CHUTE_FAR[1], CHUTE_END[2]])[1]}
        className="stroke-foreground"
        strokeWidth={1}
      />

      {/* the coin, in the chute or in its bucket */}
      <g data-turn-coin opacity={rest.coinOpacity}>
        <Coin
          x={BUCKET_CENTRES[0][0]}
          y={BUCKET_CENTRES[0][1]}
          z={TURNSTILE.coinCupZ}
          r={TURNSTILE.coinRadius}
          thickness={1.1}
          signal
        />
      </g>
      <polygon
        points={chuteWall(CHUTE_NEAR)}
        className="fill-foreground/[0.08] stroke-foreground"
        strokeWidth={0.8}
        strokeLinejoin="round"
      />

      {/* the pawl that holds each quarter turn */}
      <g data-turn-pawl>
        <line
          x1={screen([1.08, 0.52, 1.3])[0]}
          y1={screen([1.08, 0.52, 1.3])[1]}
          x2={screen([0.92, 0.42, 1.49])[0]}
          y2={screen([0.92, 0.42, 1.49])[1]}
          className="stroke-foreground"
          strokeWidth={1.4}
          strokeLinecap="round"
        />
        <circle
          cx={screen([0.92, 0.42, 1.49])[0]}
          cy={screen([0.92, 0.42, 1.49])[1]}
          r={1.4}
          className="fill-background stroke-foreground"
          strokeWidth={0.8}
        />
        <circle
          cx={screen([1.08, 0.52, 1.3])[0]}
          cy={screen([1.08, 0.52, 1.3])[1]}
          r={1.2}
          className="fill-foreground/40"
        />
      </g>

      {/* the four-arm gate */}
      {ARM_REST.map((faces, index) => (
        <g key={index} data-turn-arm>
          <polygon
            points={faces.sideA}
            className="fill-foreground/[0.07] stroke-foreground"
            strokeWidth={0.8}
            strokeLinejoin="round"
          />
          <polygon
            points={faces.sideB}
            className="fill-foreground/[0.15] stroke-foreground"
            strokeWidth={0.8}
            strokeLinejoin="round"
          />
          <polygon
            points={faces.end}
            className="fill-foreground/[0.1] stroke-foreground"
            strokeWidth={0.8}
            strokeLinejoin="round"
          />
          <polygon
            points={faces.top}
            className="fill-background stroke-foreground"
            strokeWidth={0.8}
            strokeLinejoin="round"
          />
        </g>
      ))}

      {/* the hub at the top of the shaft */}
      <Slab x={-0.32} y={-0.32} z={2.14} w={0.64} d={0.64} h={0.22} />
      <Slab x={-0.38} y={-0.38} z={2.36} w={0.76} d={0.76} h={0.06} />
      <ellipse {...disc(0, 0, 2.425, 0.12)} className="fill-foreground/35" />
    </svg>
  );
}

/* --------------------------------------------------------- 02 · one number */

const SEGMENTS: Record<string, [number, number, number, number]> = {
  a: [0.1, 1, 0.9, 1],
  b: [0.9, 1, 0.9, 0.52],
  c: [0.9, 0.48, 0.9, 0],
  d: [0.1, 0, 0.9, 0],
  e: [0.1, 0, 0.1, 0.48],
  f: [0.1, 0.52, 0.1, 1],
  g: [0.1, 0.5, 0.9, 0.5],
};

const DIGIT_SEGMENTS: Record<string, string> = {
  "0": "abcdef",
  "1": "bc",
  "2": "abged",
  "3": "abgcd",
  "4": "fgbc",
  "5": "afgcd",
  "6": "afgecd",
  "7": "abc",
  "8": "abcdefg",
  "9": "abcdfg",
};

/** One drum digit, drawn as seven strokes in the cabinet's face plane. */
function Digit({ value, x, z }: { value: string; x: number; z: number }) {
  const { width, height } = COUNTER.digit;
  const x0 = x - width / 2;
  const z0 = z - height / 2;
  return (
    <g className="stroke-background" strokeWidth={1.4} strokeLinecap="round">
      {[...DIGIT_SEGMENTS[value]].map((key) => {
        const [u0, v0, u1, v1] = SEGMENTS[key];
        const a = screen([x0 + u0 * width, COUNTER.faceY, z0 + v0 * height]);
        const b = screen([x0 + u1 * width, COUNTER.faceY, z0 + v1 * height]);
        return <line key={key} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} />;
      })}
    </g>
  );
}

const COUNTER_MID = (COUNTER.window.z0 + COUNTER.window.z1) / 2;

function camPoints(phase: number, x: number) {
  const points: Point[] = [];
  for (let index = 0; index < COUNTER.cam.steps; index++) {
    const angle = (index / COUNTER.cam.steps) * Math.PI * 2;
    const radius = counterCamRadius(angle, phase);
    points.push([
      x,
      COUNTER.cam.y + Math.sin(angle) * radius,
      COUNTER.cam.z + Math.cos(angle) * radius,
    ]);
  }
  return flat(points);
}

const CAM_HUB = Array.from({ length: 12 }, (_, index) => {
  const angle = (index / 12) * Math.PI * 2;
  return [
    2.56,
    COUNTER.cam.y + Math.sin(angle) * 0.1,
    COUNTER.cam.z + Math.cos(angle) * 0.1,
  ] as Point;
});

const LEVER_PIVOT = screen([COUNTER.lever.pivotX, COUNTER.lever.y, COUNTER.lever.pivotZ]);
const LEVER_REST = screen([COUNTER.lever.x, COUNTER.lever.y, COUNTER.lever.z]);
const ROLLER_REST = screen([COUNTER.cam.x, COUNTER.cam.y, COUNTER.cam.z + COUNTER.cam.base + 0.1]);

/** One forecast, one window, one number. */
export function NumberArt() {
  const loop = usePlateLoop(WHY_LOOP, COUNTER_STILL, (root) => {
    const tens = root.querySelector<SVGGElement>("[data-counter-tens]");
    const units = root.querySelector<SVGGElement>("[data-counter-units]");
    const cam = root.querySelector<SVGPolygonElement>("[data-counter-cam]");
    const camBack = root.querySelector<SVGPolygonElement>("[data-counter-cam-back]");
    const lever = root.querySelector<SVGLineElement>("[data-counter-lever]");
    const knob = root.querySelector<SVGCircleElement>("[data-counter-knob]");
    const rod = root.querySelector<SVGLineElement>("[data-counter-rod]");
    const roller = root.querySelector<SVGCircleElement>("[data-counter-roller]");
    if (!tens || !units || !cam || !camBack || !lever || !knob || !rod || !roller) {
      return () => {};
    }

    return (phase) => {
      const pose = counterPose(phase);
      const unitShift = -pose.unitsOffset * COUNTER.cellHeight * 10;
      const tenShift = -pose.tensOffset * COUNTER.cellHeight * 10;
      units.setAttribute("transform", `translate(0 ${n(unitShift)})`);
      tens.setAttribute("transform", `translate(0 ${n(tenShift)})`);

      cam.setAttribute("points", camPoints(phase, 2.55));
      camBack.setAttribute("points", camPoints(phase, 2.43));

      const knobAt = screen([
        COUNTER.lever.x,
        COUNTER.lever.y,
        COUNTER.lever.z + pose.travel * COUNTER.lever.lift,
      ]);
      lever.setAttribute("x2", n(knobAt[0]));
      lever.setAttribute("y2", n(knobAt[1]));
      knob.setAttribute("cx", n(knobAt[0]));
      knob.setAttribute("cy", n(knobAt[1]));

      const rollerAt = screen([COUNTER.cam.x, COUNTER.cam.y, COUNTER.cam.z + pose.camTop + 0.1]);
      roller.setAttribute("cx", n(rollerAt[0]));
      roller.setAttribute("cy", n(rollerAt[1]));
      rod.setAttribute("x1", n(rollerAt[0]));
      rod.setAttribute("y1", n(rollerAt[1]));
      rod.setAttribute("x2", n(knobAt[0]));
      rod.setAttribute("y2", n(knobAt[1]));
    };
  });

  return (
    <svg
      ref={loop}
      viewBox={ISO_VIEWBOX}
      className="w-full"
      role="presentation"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <clipPath id="counter-tens-clip">
          <polygon points={faceRect(-1.42, 2.15, -0.1, 3.72, COUNTER.faceY)} />
        </clipPath>
        <clipPath id="counter-units-clip">
          <polygon points={faceRect(0.1, 2.15, 1.42, 3.72, COUNTER.faceY)} />
        </clipPath>
      </defs>

      <Plate />
      <PlateTrim />

      {/* cabinet, base and cap */}
      <Slab x={-2.75} y={-2.05} z={0.8} w={4.5} d={1.95} h={0.35} />
      <Slab x={-2.6} y={-1.9} z={1.15} w={4.2} d={1.7} h={3.55} />
      <Slab x={-2.7} y={-2} z={4.7} w={4.4} d={1.9} h={0.25} />
      <polygon
        points={topRect(-2.55, -1.85, 1.55, -0.25, 4.951)}
        className="fill-none stroke-foreground/20"
        strokeWidth={0.7}
      />
      {(
        [
          [-2.55, -1.82],
          [1.55, -0.28],
        ] as const
      ).map(([x, y]) => (
        <ellipse key={`${x}-${y}`} {...disc(x, y, 4.955, 0.06)} className="fill-foreground/35" />
      ))}
      {(
        [
          [-2.65, -1.98],
          [1.65, -1.98],
          [-2.65, -0.15],
          [1.65, -0.15],
        ] as const
      ).map(([x, y]) => (
        <ellipse key={`${x}-${y}`} {...disc(x, y, 1.16, 0.08)} className="fill-foreground/35" />
      ))}

      <line
        x1={screen([1.751, -1.9, 2.07])[0]}
        y1={screen([1.751, -1.9, 2.07])[1]}
        x2={screen([1.751, -0.2, 2.07])[0]}
        y2={screen([1.751, -0.2, 2.07])[1]}
        className="stroke-foreground/25"
        strokeWidth={0.8}
      />
      <polygon
        points={sideRect(-1.6, 3.3, -0.9, 3.7, 1.752)}
        className="fill-background stroke-foreground/40"
        strokeWidth={0.8}
      />
      {[3.5, 3.62].map((z, index) => (
        <line
          key={z}
          x1={screen([1.753, -1.52, z])[0]}
          y1={screen([1.753, -1.52, z])[1]}
          x2={screen([1.753, index === 0 ? -1.02 : -1.18, z])[0]}
          y2={screen([1.753, index === 0 ? -1.02 : -1.18, z])[1]}
          className="stroke-foreground/30"
          strokeWidth={0.6}
        />
      ))}

      {/* the one window, split into two drums */}
      <polygon
        points={faceRect(-1.55, 2.03, 1.55, 3.84, COUNTER.faceY)}
        className="fill-background stroke-foreground"
        strokeWidth={1.1}
      />
      <polygon
        points={faceRect(
          COUNTER.window.x0,
          COUNTER.window.z0,
          COUNTER.window.x1,
          COUNTER.window.z1,
          COUNTER.faceY,
        )}
        className="fill-signal"
      />

      <g clipPath="url(#counter-tens-clip)">
        <g data-counter-tens>
          {COUNTER.tenDigits.map((value, index) => (
            <Digit
              key={value}
              value={String(value)}
              x={COUNTER.digit.tensX}
              z={COUNTER_MID - index * COUNTER.cellHeight}
            />
          ))}
        </g>
      </g>
      <g clipPath="url(#counter-units-clip)">
        <g data-counter-units>
          {COUNTER.unitDigits.map((value, index) => (
            <Digit
              key={`${value}-${index}`}
              value={String(value)}
              x={COUNTER.digit.unitsX}
              z={COUNTER_MID - index * COUNTER.cellHeight}
            />
          ))}
        </g>
      </g>

      {/* divider, bezel and index mark */}
      <polygon
        points={faceRect(-0.07, 2.15, 0.07, 3.72, COUNTER.faceY)}
        className="fill-background stroke-foreground/60"
        strokeWidth={0.7}
      />
      <polygon
        points={faceRect(-1.52, 2.06, 1.52, 3.81, COUNTER.faceY)}
        className="fill-none stroke-foreground/25"
        strokeWidth={0.7}
      />
      <polygon
        points={flat([
          [-1.5, COUNTER.faceY, 2.99],
          [-1.5, COUNTER.faceY, 2.88],
          [-1.41, COUNTER.faceY, 2.935],
        ])}
        className="fill-foreground"
      />
      {(
        [
          [-1.48, 2.12],
          [1.48, 2.12],
          [-1.48, 3.75],
          [1.48, 3.75],
        ] as const
      ).map(([x, z]) => (
        <ellipse key={`${x}-${z}`} {...disc(x, -0.181, z, 0.05)} className="fill-foreground/35" />
      ))}

      {/* label plate and vents on the face */}
      <polygon
        points={faceRect(-0.9, 3.96, 0.9, 4.3, COUNTER.faceY)}
        className="fill-background stroke-foreground/30"
        strokeWidth={0.8}
      />
      {[4.08, 4.2].map((z, index) => (
        <line
          key={z}
          x1={screen([-0.6, COUNTER.faceY, z])[0]}
          y1={screen([-0.6, COUNTER.faceY, z])[1]}
          x2={screen([index === 0 ? 0.3 : 0.55, COUNTER.faceY, z])[0]}
          y2={screen([index === 0 ? 0.3 : 0.55, COUNTER.faceY, z])[1]}
          className="stroke-foreground/30"
          strokeWidth={0.7}
        />
      ))}
      {[1.35, 1.55, 1.75].map((z) => (
        <line
          key={z}
          x1={screen([-1.0, COUNTER.faceY, z])[0]}
          y1={screen([-1.0, COUNTER.faceY, z])[1]}
          x2={screen([0.8, COUNTER.faceY, z])[0]}
          y2={screen([0.8, COUNTER.faceY, z])[1]}
          className="stroke-foreground/25"
          strokeWidth={0.7}
        />
      ))}
      {[1.4, 1.6, 1.8].map((z) => (
        <line
          key={`side-${z}`}
          x1={screen([1.75, -1.9, z])[0]}
          y1={screen([1.75, -1.9, z])[1]}
          x2={screen([1.75, -0.2, z])[0]}
          y2={screen([1.75, -0.2, z])[1]}
          className="stroke-foreground/25"
          strokeWidth={0.7}
        />
      ))}

      {/* the cam, its pillar and the follower */}
      <Slab x={2.02} y={-1.45} z={0.8} w={0.24} d={0.6} h={1.28} />
      <Slab x={1.98} y={-1.35} z={2.08} w={0.34} d={0.4} h={0.2} />
      {(
        [
          [2.06, -1.26],
          [2.24, -1.04],
        ] as const
      ).map(([x, y]) => (
        <ellipse key={`${x}-${y}`} {...disc(x, y, 2.29, 0.06)} className="fill-foreground/40" />
      ))}
      <line
        x1={screen([2.25, COUNTER.cam.y, COUNTER.cam.z])[0]}
        y1={screen([2.25, COUNTER.cam.y, COUNTER.cam.z])[1]}
        x2={screen([2.55, COUNTER.cam.y, COUNTER.cam.z])[0]}
        y2={screen([2.55, COUNTER.cam.y, COUNTER.cam.z])[1]}
        className="stroke-foreground"
        strokeWidth={1.4}
      />
      <polygon
        data-counter-cam-back
        points={camPoints(0, 2.43)}
        className="fill-foreground/[0.16] stroke-foreground/30"
        strokeWidth={0.7}
      />
      <polygon
        data-counter-cam
        points={camPoints(0, 2.55)}
        className="fill-background stroke-foreground"
        strokeWidth={1}
      />
      <polygon points={flat(CAM_HUB)} className="fill-foreground" />

      <circle
        data-counter-roller
        cx={ROLLER_REST[0]}
        cy={ROLLER_REST[1]}
        r={1.6}
        className="fill-background stroke-foreground"
        strokeWidth={0.9}
      />
      <line
        data-counter-rod
        x1={ROLLER_REST[0]}
        y1={ROLLER_REST[1]}
        x2={LEVER_REST[0]}
        y2={LEVER_REST[1]}
        className="stroke-foreground"
        strokeWidth={1.2}
      />
      <line
        data-counter-lever
        x1={LEVER_PIVOT[0]}
        y1={LEVER_PIVOT[1]}
        x2={LEVER_REST[0]}
        y2={LEVER_REST[1]}
        className="stroke-foreground"
        strokeWidth={2.2}
        strokeLinecap="round"
      />
      <circle
        cx={LEVER_PIVOT[0]}
        cy={LEVER_PIVOT[1]}
        r={2.2}
        className="fill-background stroke-foreground"
        strokeWidth={1}
      />
      <circle
        data-counter-knob
        cx={LEVER_REST[0]}
        cy={LEVER_REST[1]}
        r={2.6}
        className="fill-background stroke-foreground"
        strokeWidth={1.1}
      />
    </svg>
  );
}

/* -------------------------------------------------- 03 · settled in public */

const NOTICE_FACE = NOTICE.faceY;
const SHEET_RECT = faceRect(
  NOTICE.sheet.x0,
  NOTICE.sheet.z0,
  NOTICE.sheet.x1,
  NOTICE.sheet.z1,
  NOTICE_FACE,
);
const SHEET_CLIP = faceRect(-2.2, 3.18, 1.9, 4.72, NOTICE_FACE);

const onFace = (x: number, z: number) => screen([x, NOTICE_FACE, z]);
const PINION_REST = screen([NOTICE.parkX, -1.4, 4.72]);
const TRIP_REST = screen([NOTICE.parkX + 0.55, -1.5, 4.88]);

function SheetLines() {
  return (
    <>
      {([4.36, 4.12, 3.88] as const).map((z, index) => (
        <line
          key={z}
          x1={onFace(-1.55, z)[0]}
          y1={onFace(-1.55, z)[1]}
          x2={onFace(index === 0 ? 1.2 : index === 1 ? 0.9 : 1.1, z)[0]}
          y2={onFace(index === 0 ? 1.2 : index === 1 ? 0.9 : 1.1, z)[1]}
          className="stroke-foreground/30"
          strokeWidth={0.8}
        />
      ))}
      <line
        x1={onFace(-1.55, 3.7)[0]}
        y1={onFace(-1.55, 3.7)[1]}
        x2={onFace(0.15, 3.7)[0]}
        y2={onFace(0.15, 3.7)[1]}
        className="stroke-foreground/20"
        strokeWidth={0.7}
      />
    </>
  );
}

const PINION_POINTS = Array.from({ length: 24 }, (_, index) => {
  const angle = (index / 24) * Math.PI * 2;
  return [NOTICE.parkX + Math.cos(angle) * 0.36, -1.4, 4.72 + Math.sin(angle) * 0.36] as Point;
});

const RACK = Array.from({ length: 30 }, (_, index) => -2.35 + index * 0.16);

/** A question posted in public, dated, and stamped. */
export function NoticeArt() {
  const rest = noticePose(0);
  const teeth = Array.from({ length: 8 }, (_, index) => (index / 8) * Math.PI * 2);

  const loop = usePlateLoop(WHY_LOOP, NOTICE_STILL, (root) => {
    const carriage = root.querySelector<SVGGElement>("[data-notice-carriage]");
    const head = root.querySelector<SVGGElement>("[data-notice-head]");
    const oldSheet = root.querySelector<SVGGElement>("[data-notice-old]");
    const freshSheet = root.querySelector<SVGGElement>("[data-notice-fresh]");
    const clip = root.querySelector<SVGGElement>("[data-notice-clip]");
    const mark = root.querySelector<SVGGElement>("[data-notice-mark]");
    const ink = root.querySelector<SVGEllipseElement>("[data-notice-ink]");
    const trip = root.querySelector<SVGLineElement>("[data-notice-trip]");
    const toothLines = [...root.querySelectorAll<SVGLineElement>("[data-notice-tooth]")];
    const spokes = [...root.querySelectorAll<SVGLineElement>("[data-notice-spoke]")];
    if (
      !carriage ||
      !head ||
      !oldSheet ||
      !freshSheet ||
      !clip ||
      !mark ||
      !ink ||
      !trip ||
      toothLines.length === 0 ||
      spokes.length === 0
    ) {
      return () => {};
    }

    return (phase) => {
      const pose = noticePose(phase);
      const dx = pose.carX - NOTICE.parkX;
      carriage.setAttribute("transform", `translate(${n(dx * 8.660254)} ${n(dx * 5)})`);
      head.setAttribute("transform", `translate(0 ${n(pose.headDrop * NOTICE.headTravel * 10)})`);
      oldSheet.setAttribute("transform", `translate(0 ${n(-pose.sheetDrop * 10)})`);
      freshSheet.setAttribute("transform", `translate(0 ${n(-pose.freshDrop * 10)})`);
      clip.setAttribute("transform", `translate(0 ${n(-pose.clip * 1.2)})`);
      mark.setAttribute("opacity", n(pose.markOpacity));
      ink.setAttribute("opacity", n(pose.ink * 0.85));

      const spin = dx / 0.36;
      toothLines.forEach((line, index) => {
        const angle = spin + teeth[index]!;
        const inner = screen([
          NOTICE.parkX + Math.cos(angle) * 0.2,
          -1.4,
          4.72 + Math.sin(angle) * 0.2,
        ]);
        const outer = screen([
          NOTICE.parkX + Math.cos(angle) * 0.4,
          -1.4,
          4.72 + Math.sin(angle) * 0.4,
        ]);
        line.setAttribute("x1", n(inner[0]));
        line.setAttribute("y1", n(inner[1]));
        line.setAttribute("x2", n(outer[0]));
        line.setAttribute("y2", n(outer[1]));
      });
      spokes.forEach((spoke, index) => {
        const angle = spin * 0.6 + (index * Math.PI * 2) / 3;
        const end = screen([
          NOTICE.parkX + Math.cos(angle) * 0.14,
          -1.38,
          4.72 + Math.sin(angle) * 0.14,
        ]);
        spoke.setAttribute("x2", n(end[0]));
        spoke.setAttribute("y2", n(end[1]));
      });

      trip.setAttribute("y2", n(TRIP_REST[1] + pose.trip * 3.4));
    };
  });

  return (
    <svg
      ref={loop}
      viewBox={ISO_VIEWBOX}
      className="w-full"
      role="presentation"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <clipPath id="notice-sheet-clip">
          <polygon points={SHEET_CLIP} />
        </clipPath>
      </defs>

      <Plate />
      <PlateTrim />

      {/* the two posts, flanking the board */}
      <Slab x={-3.05} y={-2.6} z={0.8} w={0.45} d={0.45} h={4.2} />
      <Slab x={2.6} y={-2.6} z={0.8} w={0.45} d={0.45} h={4.2} />
      <Slab x={-3.15} y={-2.75} z={0.8} w={0.75} d={0.75} h={0.3} />
      <Slab x={2.4} y={-2.75} z={0.8} w={0.75} d={0.75} h={0.3} />
      {(
        [
          [-3.0, -2.6],
          [2.72, -2.6],
          [-3.0, -2.18],
          [2.72, -2.18],
        ] as const
      ).map(([x, y]) => (
        <ellipse key={`${x}-${y}`} {...disc(x, y, 1.105, 0.075)} className="fill-foreground/35" />
      ))}

      {/* the board and its frame */}
      <Slab x={-2.5} y={-2.15} z={2.9} w={5} d={0.5} h={2.1} />
      <Slab x={-2.6} y={-2.25} z={5} w={5.2} d={0.7} h={0.2} />
      <polygon
        points={topRect(-2.45, -2.1, 2.45, -1.7, 5.201)}
        className="fill-none stroke-foreground/20"
        strokeWidth={0.7}
      />
      <polygon
        points={faceRect(-2.35, 3.05, 2.35, 4.85, NOTICE_FACE + 0.01)}
        className="fill-none stroke-foreground/20"
        strokeWidth={0.8}
      />

      {/* the filing slot at the foot of the board */}
      <polygon
        points={faceRect(-2.1, 3.1, 2.1, 3.18, NOTICE_FACE + 0.02)}
        className="fill-foreground/70"
      />
      <line
        x1={onFace(-2.1, 3.19)[0]}
        y1={onFace(-2.1, 3.19)[1]}
        x2={onFace(2.1, 3.19)[0]}
        y2={onFace(2.1, 3.19)[1]}
        className="stroke-foreground"
        strokeWidth={0.9}
      />
      <polygon
        points={faceRect(-0.8, 2.94, 0.8, 3.04, NOTICE_FACE + 0.02)}
        className="fill-background stroke-foreground/30"
        strokeWidth={0.7}
      />
      <line
        x1={onFace(-0.55, 2.99)[0]}
        y1={onFace(-0.55, 2.99)[1]}
        x2={onFace(0.35, 2.99)[0]}
        y2={onFace(0.35, 2.99)[1]}
        className="stroke-foreground/30"
        strokeWidth={0.6}
      />

      {/* the sheets, clipped to the board's opening */}
      <g clipPath="url(#notice-sheet-clip)">
        <g data-notice-fresh transform={`translate(0 ${n(-rest.freshDrop * 10)})`}>
          <polygon
            points={SHEET_RECT}
            className="fill-background stroke-foreground"
            strokeWidth={0.9}
          />
          <SheetLines />
        </g>
        <g data-notice-old transform={`translate(0 ${n(-rest.sheetDrop * 10)})`}>
          <polygon
            points={SHEET_RECT}
            className="fill-background stroke-foreground"
            strokeWidth={0.9}
          />
          <SheetLines />
          <g data-notice-mark opacity={rest.markOpacity}>
            <polygon
              points={faceRect(-0.4, 3.92, 0.4, 4.04, NOTICE_FACE + 0.02)}
              className="fill-signal"
            />
            <line
              x1={onFace(-0.4, 4.13)[0]}
              y1={onFace(-0.4, 4.13)[1]}
              x2={onFace(0.32, 4.13)[0]}
              y2={onFace(0.32, 4.13)[1]}
              className="stroke-foreground/70"
              strokeWidth={1.1}
            />
            <line
              x1={onFace(-0.4, 4.23)[0]}
              y1={onFace(-0.4, 4.23)[1]}
              x2={onFace(0.08, 4.23)[0]}
              y2={onFace(0.08, 4.23)[1]}
              className="stroke-foreground/70"
              strokeWidth={1.1}
            />
          </g>
        </g>
      </g>

      {/* the clip bar that pins the sheet */}
      <g data-notice-clip transform={`translate(0 ${n(-rest.clip * 1.2)})`}>
        <polygon
          points={faceRect(-1.9, 4.56, 1.6, 4.63, NOTICE_FACE + 0.04)}
          className="fill-foreground/15 stroke-foreground"
          strokeWidth={0.9}
        />
        {[-1.85, 1.55].map((x) => (
          <ellipse
            key={x}
            {...disc(x, NOTICE_FACE + 0.05, 4.595, 0.05)}
            className="fill-foreground/50"
          />
        ))}
      </g>

      {/* the date slip and its pin, fixed to the board */}
      <polygon
        points={faceRect(0.85, 3.3, 1.45, 3.9, NOTICE_FACE + 0.03)}
        className="fill-background stroke-foreground/40"
        strokeWidth={0.7}
      />
      {[3.78, 3.66, 3.54].map((z, index) => (
        <line
          key={z}
          x1={onFace(0.94, z)[0]}
          y1={onFace(0.94, z)[1]}
          x2={onFace(index === 2 ? 1.18 : 1.36, z)[0]}
          y2={onFace(index === 2 ? 1.18 : 1.36, z)[1]}
          className="stroke-foreground/30"
          strokeWidth={0.6}
        />
      ))}
      <circle
        cx={onFace(1.15, 3.82)[0]}
        cy={onFace(1.15, 3.82)[1]}
        r={1.9}
        className="fill-signal stroke-signal"
      />

      {/* the top rail and its rack */}
      <Slab x={-2.45} y={-1.55} z={4.86} w={4.9} d={0.1} h={0.14} />
      <Slab x={-2.6} y={-2.15} z={4.84} w={0.2} d={0.7} h={0.12} />
      <Slab x={2.4} y={-2.15} z={4.84} w={0.2} d={0.7} h={0.12} />
      {RACK.map((x) => (
        <line
          key={x}
          x1={screen([x, -1.449, 4.87])[0]}
          y1={screen([x, -1.449, 4.87])[1]}
          x2={screen([x, -1.449, 4.96])[0]}
          y2={screen([x, -1.449, 4.96])[1]}
          className="stroke-foreground/30"
          strokeWidth={0.6}
        />
      ))}
      <Slab x={0.32} y={-1.62} z={4.83} w={0.16} d={0.24} h={0.14} />
      <ellipse {...disc(0.4, -1.55, 4.975, 0.05)} className="fill-foreground/40" />

      {/* the ink tray on its bracket */}
      <Slab x={2.5} y={-2.15} z={4.02} w={0.45} d={0.85} h={0.1} />
      <Slab x={1.85} y={-1.9} z={4.12} w={0.7} d={0.6} h={0.12} />
      <polygon points={topRect(1.9, -1.85, 2.5, -1.35, 4.23)} className="fill-foreground/75" />
      <polygon
        points={topRect(1.87, -1.88, 2.53, -1.32, 4.24)}
        className="fill-none stroke-foreground/40"
        strokeWidth={0.7}
      />
      <ellipse
        data-notice-ink
        {...disc(2.2, -1.6, 4.25, 0.24)}
        opacity={rest.ink * 0.85}
        className="fill-none stroke-signal"
        strokeWidth={1.1}
      />

      {/* the carriage, its pinion and the stamp head */}
      <g data-notice-carriage>
        <Slab x={NOTICE.parkX - 0.36} y={-1.72} z={4.6} w={0.72} d={0.3} h={0.3} />
        {(
          [
            [NOTICE.parkX - 0.32, -1.74],
            [NOTICE.parkX + 0.02, -1.74],
          ] as const
        ).map(([x, y]) => (
          <Slab key={x} x={x} y={y} z={4.58} w={0.3} d={0.34} h={0.34} />
        ))}
        <Slab x={NOTICE.parkX - 0.05} y={-1.68} z={4.3} w={0.1} d={0.1} h={0.32} />
        <line
          data-notice-trip
          x1={screen([NOTICE.parkX + 0.15, -1.5, 4.86])[0]}
          y1={screen([NOTICE.parkX + 0.15, -1.5, 4.86])[1]}
          x2={TRIP_REST[0]}
          y2={TRIP_REST[1]}
          className="stroke-foreground"
          strokeWidth={1.4}
          strokeLinecap="round"
        />
        <circle
          cx={screen([NOTICE.parkX + 0.15, -1.5, 4.86])[0]}
          cy={screen([NOTICE.parkX + 0.15, -1.5, 4.86])[1]}
          r={1.5}
          className="fill-background stroke-foreground"
          strokeWidth={0.8}
        />

        <polygon
          points={flat(PINION_POINTS)}
          className="fill-background stroke-foreground"
          strokeWidth={0.9}
        />
        {teeth.map((angle, index) => {
          const inner = screen([
            NOTICE.parkX + Math.cos(angle) * 0.2,
            -1.4,
            4.72 + Math.sin(angle) * 0.2,
          ]);
          const outer = screen([
            NOTICE.parkX + Math.cos(angle) * 0.4,
            -1.4,
            4.72 + Math.sin(angle) * 0.4,
          ]);
          return (
            <line
              key={`tooth-${index}`}
              data-notice-tooth
              x1={inner[0]}
              y1={inner[1]}
              x2={outer[0]}
              y2={outer[1]}
              className="stroke-foreground"
              strokeWidth={0.8}
            />
          );
        })}
        <circle
          cx={PINION_REST[0]}
          cy={PINION_REST[1]}
          r={2}
          className="fill-background stroke-foreground"
          strokeWidth={0.9}
        />
        {[0, 1, 2].map((index) => {
          const angle = (index * Math.PI * 2) / 3;
          const end = screen([
            NOTICE.parkX + Math.cos(angle) * 0.14,
            -1.38,
            4.72 + Math.sin(angle) * 0.14,
          ]);
          return (
            <line
              key={`spoke-${index}`}
              data-notice-spoke
              x1={PINION_REST[0]}
              y1={PINION_REST[1]}
              x2={end[0]}
              y2={end[1]}
              className="stroke-foreground"
              strokeWidth={0.9}
            />
          );
        })}

        <g data-notice-head transform={`translate(0 ${n(rest.headDrop * NOTICE.headTravel * 10)})`}>
          <Slab x={NOTICE.parkX - 0.4} y={-1.92} z={4.3} w={0.8} d={0.46} h={0.26} />
          <polygon
            points={faceRect(NOTICE.parkX - 0.32, 4.34, NOTICE.parkX + 0.32, 4.52, -1.439)}
            className="fill-none stroke-foreground/45"
            strokeWidth={0.7}
          />
          <polygon
            points={faceRect(NOTICE.parkX - 0.34, 4.3, NOTICE.parkX + 0.34, 4.36, -1.438)}
            className="fill-foreground/25"
          />
        </g>
      </g>

      {/* the finials */}
      <Slab x={-3.05} y={-2.6} z={5} w={0.45} d={0.45} h={0.35} />
      <Slab x={2.6} y={-2.6} z={5} w={0.45} d={0.45} h={0.35} />
    </svg>
  );
}
