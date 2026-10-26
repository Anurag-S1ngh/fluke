"use client";

import type * as React from "react";

import { Coin, disc, flat, ISO_VIEWBOX, Plate, screen, Slab, type Point } from "./mini-iso";
import { usePlateLoop } from "./plate-loop";
import { STAKE, STAKE_STILL, stakePose, WHY_LOOP } from "./why-motion";

/** Screen offset of a world move: the plate draws 10 px to the unit. */
const shift = ([dx, dy, dz]: Point): [number, number] => [
  (dx - dy) * 8.660254,
  (dx + dy) * 5 - dz * 10,
];

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

const n = (value: number) => (Math.round(value * 100) / 100).toString();

/** The machined trim every plate carries: a rooted ruler and a label plate. */
function PlateTrim({ narrow = false }: { narrow?: boolean }) {
  const ticks: React.ReactNode[] = [];
  const end = narrow ? 2.25 : 3.05;
  for (let x = -3; x <= end; x += 0.4) {
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
      <Slab x={-3.2} y={2.9} z={0.8} w={narrow ? 5.65 : 6.4} d={0.3} h={0.03} />
      {ticks}
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
        <ellipse key={`${x}-${y}`} {...disc(x, y, 0.853, 0.075)} className="fill-foreground/35" />
      ))}
    </>
  );
}

/** Paper holes repeat eight times across one feed, so the reset is invisible. */
const PAPER_HOLES = Array.from({ length: 18 }, (_, index) =>
  [-1.28, 0.68].map((y) => [-3.4 + index * STAKE.paperHolePitch, y] as const),
).flat();

const PAPER_CLIP = flat([
  [STAKE.paper.x0, STAKE.paper.y0, STAKE.paper.z],
  [STAKE.paper.x1, STAKE.paper.y0, STAKE.paper.z],
  [STAKE.paper.x1, STAKE.paper.y1, STAKE.paper.z],
  [STAKE.paper.x0, STAKE.paper.y1, STAKE.paper.z],
]);

const PLATEN_CLIP = flat([
  [-2.55, -2.4, 1.7],
  [1.55, -2.4, 1.7],
  [1.55, 1.75, 1.7],
  [-2.55, 1.75, 1.7],
]);

const WHEEL = disc(STAKE.wheel.x, STAKE.wheel.y, STAKE.wheel.z, STAKE.wheel.r);
const WHEEL_CENTRE = screen([STAKE.wheel.x, STAKE.wheel.y, STAKE.wheel.z]);
const CUP = screen(STAKE.coinCup);
/** The chute's rails sit either side of its diagonal, on the near and far side. */
const CHUTE_NEAR = [0.401, 0.376] as const;
const CHUTE_FAR = [-0.401, -0.376] as const;

const chuteFloor = flat([
  [
    STAKE.coinStart[0] + CHUTE_NEAR[0],
    STAKE.coinStart[1] + CHUTE_NEAR[1],
    STAKE.coinStart[2] - 0.06,
  ],
  [STAKE.coinStart[0] + CHUTE_FAR[0], STAKE.coinStart[1] + CHUTE_FAR[1], STAKE.coinStart[2] - 0.06],
  [
    STAKE.coinRampEnd[0] + CHUTE_FAR[0],
    STAKE.coinRampEnd[1] + CHUTE_FAR[1],
    STAKE.coinRampEnd[2] - 0.06,
  ],
  [
    STAKE.coinRampEnd[0] + CHUTE_NEAR[0],
    STAKE.coinRampEnd[1] + CHUTE_NEAR[1],
    STAKE.coinRampEnd[2] - 0.06,
  ],
]);

const railTop = (offset: readonly [number, number]) => {
  const a = screen([
    STAKE.coinStart[0] + offset[0],
    STAKE.coinStart[1] + offset[1],
    STAKE.coinStart[2] + 0.12,
  ]);
  const b = screen([
    STAKE.coinRampEnd[0] + offset[0],
    STAKE.coinRampEnd[1] + offset[1],
    STAKE.coinRampEnd[2] + 0.12,
  ]);
  return { a, b };
};
const farRailTop = railTop(CHUTE_FAR);
const nearRailTop = railTop(CHUTE_NEAR);

/** A stake is real money pressed onto the claim, not a raised hand. */
export function StakeArt() {
  const rest = stakePose(0);

  const loop = usePlateLoop(WHY_LOOP, STAKE_STILL, (root) => {
    const paper = root.querySelector<SVGGElement>("[data-stake-paper]");
    const mark = root.querySelector<SVGGElement>("[data-stake-mark]");
    const coin = root.querySelector<SVGGElement>("[data-stake-coin]");
    const ram = root.querySelector<SVGGElement>("[data-stake-ram]");
    const lamp = root.querySelector<SVGPolygonElement>("[data-stake-lamp]");
    const flash = root.querySelector<SVGEllipseElement>("[data-stake-flash]");
    const spokes = [...root.querySelectorAll<SVGLineElement>("[data-stake-spoke]")];
    const crank = root.querySelector<SVGLineElement>("[data-stake-crank]");
    const knob = root.querySelector<SVGCircleElement>("[data-stake-knob]");
    if (!paper || !mark || !coin || !ram || !lamp || !flash || !crank || !knob) {
      return () => {};
    }

    return (phase) => {
      const pose = stakePose(phase);
      const feed = shift([-pose.feed * STAKE.paperFeed, 0, 0]);
      paper.setAttribute("transform", `translate(${n(feed[0])} ${n(feed[1])})`);
      mark.setAttribute("opacity", n(pose.markOpacity));

      const at = screen(pose.coin);
      coin.setAttribute("transform", `translate(${n(at[0] - CUP[0])} ${n(at[1] - CUP[1])})`);
      coin.setAttribute("opacity", n(pose.coinOpacity));

      ram.setAttribute("transform", `translate(0 ${n(pose.ram * STAKE.pressTravel * 10)})`);
      lamp.setAttribute("opacity", n(pose.armed));
      flash.setAttribute("opacity", n(pose.flash * 0.75));

      spokes.forEach((spoke, index) => {
        const angle = pose.wheel + (Math.PI / 2) * index;
        const at = screen([
          STAKE.wheel.x + Math.cos(angle) * STAKE.wheel.r,
          STAKE.wheel.y + Math.sin(angle) * STAKE.wheel.r,
          STAKE.wheel.z,
        ]);
        spoke.setAttribute("x2", n(at[0]));
        spoke.setAttribute("y2", n(at[1]));
      });

      const crankAngle = pose.wheel + Math.PI / 4;
      const rim = screen([
        STAKE.wheel.x + Math.cos(crankAngle) * STAKE.wheel.r,
        STAKE.wheel.y + Math.sin(crankAngle) * STAKE.wheel.r,
        STAKE.wheel.z,
      ]);
      const end = screen([
        STAKE.wheel.x + Math.cos(crankAngle) * (STAKE.wheel.r + 0.16),
        STAKE.wheel.y + Math.sin(crankAngle) * (STAKE.wheel.r + 0.16),
        STAKE.wheel.z,
      ]);
      crank.setAttribute("x1", n(rim[0]));
      crank.setAttribute("y1", n(rim[1]));
      crank.setAttribute("x2", n(end[0]));
      crank.setAttribute("y2", n(end[1]));
      knob.setAttribute("cx", n(end[0]));
      knob.setAttribute("cy", n(end[1]));
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
        <clipPath id="stake-paper-clip">
          <polygon points={PAPER_CLIP} />
        </clipPath>
        <clipPath id="stake-platen-clip">
          <polygon points={PLATEN_CLIP} />
        </clipPath>
      </defs>

      <Plate />
      <PlateTrim narrow />

      {/* the platen and its machined top */}
      <Slab x={-2.55} y={-2.4} z={0.8} w={4.1} d={4.15} h={0.9} />
      <polygon
        points={topRect(-2.45, -2.3, 1.45, 1.65, 1.701)}
        className="fill-none stroke-foreground/20"
        strokeWidth={0.8}
      />

      {/* the paper tape, fed from the right lip under the die to the left */}
      <g clipPath="url(#stake-paper-clip)">
        <g data-stake-paper>
          <Slab x={-3.4} y={STAKE.paper.y0} z={1.71} w={5.7} d={2.1} h={0.06} />
          {PAPER_HOLES.map(([x, y]) => (
            <ellipse
              key={`${x}-${y}`}
              {...disc(x, y, 1.776, 0.072)}
              className="fill-foreground/40"
            />
          ))}
          {[STAKE.paper.y0 + 0.05, STAKE.paper.y1 - 0.05].map((y) => (
            <line
              key={y}
              x1={screen([-3.4, y, 1.777])[0]}
              y1={screen([-3.4, y, 1.777])[1]}
              x2={screen([2.3, y, 1.777])[0]}
              y2={screen([2.3, y, 1.777])[1]}
              className="stroke-foreground/25"
              strokeWidth={0.8}
            />
          ))}

          {/* what the die prints: the claim, struck in signal */}
          <g data-stake-mark opacity={rest.markOpacity}>
            {([-1.18, -0.98, -0.8] as const).map((y, index) => (
              <line
                key={y}
                x1={screen([-0.42, y, 1.778])[0]}
                y1={screen([-0.42, y, 1.778])[1]}
                x2={screen([index === 0 ? 0.42 : index === 1 ? 0.28 : 0.06, y, 1.778])[0]}
                y2={screen([index === 0 ? 0.42 : index === 1 ? 0.28 : 0.06, y, 1.778])[1]}
                className="stroke-foreground/70"
                strokeWidth={1.1}
              />
            ))}
            <polygon
              points={topRect(-0.42, -0.72, 0.42, -0.64, 1.779)}
              className="fill-signal stroke-signal"
              strokeWidth={0.6}
            />
          </g>
        </g>
      </g>

      {/* the lips that keep the tape ends behind an edge */}
      <Slab x={-2.18} y={-1.45} z={1.72} w={0.18} d={2.3} h={0.09} />
      <Slab x={1.28} y={-1.45} z={1.72} w={0.18} d={2.3} h={0.09} />
      {(
        [
          [-2.09, -1.36],
          [-2.09, 0.76],
          [1.37, -1.36],
          [1.37, 0.76],
        ] as const
      ).map(([x, y]) => (
        <ellipse key={`${x}-${y}`} {...disc(x, y, 1.815, 0.065)} className="fill-foreground/40" />
      ))}

      {/* the drawer the coin is kept in, set into the platen face */}
      <polygon
        points={faceRect(STAKE.drawer.x, STAKE.drawer.z0, STAKE.drawer.w, STAKE.drawer.z1, 1.755)}
        className="fill-foreground/[0.07] stroke-foreground"
        strokeWidth={1}
      />
      <polygon
        points={faceRect(
          STAKE.drawer.x + 0.06,
          STAKE.drawer.z0 + 0.06,
          STAKE.drawer.w - 0.06,
          STAKE.drawer.z1 - 0.06,
          1.756,
        )}
        className="fill-none stroke-foreground/30"
        strokeWidth={0.7}
      />
      <circle
        cx={screen([0.72, 1.76, 1.2])[0]}
        cy={screen([0.72, 1.76, 1.2])[1]}
        r={2.1}
        className="fill-background stroke-foreground"
        strokeWidth={0.9}
      />
      <ellipse {...disc(0.72, 1.78, 1.2, 0.05)} className="fill-foreground/40" />

      {/* the cup: a dark hole and its rim */}
      <ellipse {...disc(STAKE.cup.x, STAKE.cup.y, 1.705, 0.36)} className="fill-foreground/70" />
      <ellipse
        {...disc(STAKE.cup.x, STAKE.cup.y, 1.715, 0.5)}
        className="fill-none stroke-foreground"
        strokeWidth={1}
      />
      <ellipse
        {...disc(STAKE.cup.x, STAKE.cup.y, 1.72, 0.56)}
        className="fill-none stroke-foreground/30"
        strokeWidth={0.6}
      />

      {/* the press frame */}
      <Slab x={-2.55} y={-2.35} z={0.8} w={0.9} d={0.9} h={4.3} />
      <Slab x={-2.68} y={-2.48} z={0.8} w={1.16} d={1.16} h={0.16} />
      <Slab x={-2.55} y={-2.3} z={5.1} w={3.6} d={1.45} h={0.55} />
      {(
        [
          [-2.36, -2.12],
          [-2.36, -1.02],
          [0.82, -2.12],
          [0.82, -1.02],
        ] as const
      ).map(([x, y]) => (
        <ellipse key={`${x}-${y}`} {...disc(x, y, 5.66, 0.08)} className="fill-foreground/35" />
      ))}
      <polygon
        points={faceRect(-2.45, 3.45, -1.75, 3.95, -1.44)}
        className="fill-background stroke-foreground/35"
        strokeWidth={0.8}
      />
      {[3.85, 3.65].map((z, index) => (
        <line
          key={z}
          x1={screen([-2.36, -1.43, z])[0]}
          y1={screen([-2.36, -1.43, z])[1]}
          x2={screen([index === 1 ? -2.7 : -2.14, -1.43, z])[0]}
          y2={screen([index === 1 ? -2.7 : -2.14, -1.43, z])[1]}
          className="stroke-foreground/35"
          strokeWidth={0.7}
        />
      ))}
      {(
        [
          [-2.42, -2.22],
          [-1.77, -2.22],
          [-2.42, -1.58],
          [-1.77, -1.58],
        ] as const
      ).map(([x, y]) => (
        <ellipse key={`${x}-${y}`} {...disc(x, y, 0.965, 0.085)} className="fill-foreground/35" />
      ))}

      {/* the moving ram: a rod and its die */}
      <g data-stake-ram>
        <Slab x={-0.18} y={-1.08} z={2.72} w={0.36} d={0.36} h={1.88} />
        <Slab x={-0.5} y={-1.3} z={2.27} w={1} d={0.9} h={0.45} />
        <polygon
          points={faceRect(-0.42, 2.33, 0.42, 2.64, -0.399)}
          className="fill-none stroke-foreground/45"
          strokeWidth={0.7}
        />
      </g>

      {/* the fixed guide the rod passes through */}
      <Slab x={-0.45} y={-1.35} z={4.6} w={0.9} d={0.9} h={0.5} />
      <Slab x={-0.58} y={-1.48} z={4.52} w={1.16} d={1.16} h={0.1} />
      {(
        [
          [-0.5, -1.4],
          [0.5, -1.4],
          [-0.5, -0.4],
          [0.5, -0.4],
        ] as const
      ).map(([x, y]) => (
        <ellipse key={`${x}-${y}`} {...disc(x, y, 4.63, 0.07)} className="fill-foreground/40" />
      ))}

      {/* the tell-tale: lit while the coin arms the press */}
      <polygon
        points={faceRect(0.46, 5.18, 0.78, 5.5, -0.84)}
        className="fill-background stroke-foreground"
        strokeWidth={0.9}
      />
      <polygon
        data-stake-lamp
        points={faceRect(0.51, 5.23, 0.73, 5.45, -0.835)}
        opacity={rest.armed}
        className="fill-signal"
      />

      {/* the coin chute and its magazine */}
      <Slab x={2.85} y={-0.7} z={0.8} w={0.3} d={0.3} h={2.04} />
      <Slab x={2.72} y={-0.83} z={0.8} w={0.56} d={0.56} h={0.12} />
      {(
        [
          [2.77, -0.63],
          [3.23, -0.63],
          [2.77, -0.37],
          [3.23, -0.37],
        ] as const
      ).map(([x, y]) => (
        <ellipse key={`${x}-${y}`} {...disc(x, y, 0.925, 0.075)} className="fill-foreground/35" />
      ))}
      <Slab x={2.9} y={-0.65} z={2.84} w={0.2} d={0.3} h={0.12} />
      <Slab x={2.85} y={-0.75} z={2.96} w={0.3} d={0.4} h={0.48} />
      <Slab x={2.8} y={-0.8} z={3.44} w={0.4} d={0.5} h={0.1} />
      <polygon points={faceRect(2.9, 3.06, 3.1, 3.36, -0.349)} className="fill-foreground/60" />
      <polygon points={chuteFloor} className="fill-foreground/[0.06]" />
      <line
        x1={
          screen([
            STAKE.coinRampEnd[0] + CHUTE_NEAR[0],
            STAKE.coinRampEnd[1] + CHUTE_NEAR[1],
            STAKE.coinRampEnd[2] - 0.06,
          ])[0]
        }
        y1={
          screen([
            STAKE.coinRampEnd[0] + CHUTE_NEAR[0],
            STAKE.coinRampEnd[1] + CHUTE_NEAR[1],
            STAKE.coinRampEnd[2] - 0.06,
          ])[1]
        }
        x2={
          screen([
            STAKE.coinRampEnd[0] + CHUTE_FAR[0],
            STAKE.coinRampEnd[1] + CHUTE_FAR[1],
            STAKE.coinRampEnd[2] - 0.06,
          ])[0]
        }
        y2={
          screen([
            STAKE.coinRampEnd[0] + CHUTE_FAR[0],
            STAKE.coinRampEnd[1] + CHUTE_FAR[1],
            STAKE.coinRampEnd[2] - 0.06,
          ])[1]
        }
        className="stroke-foreground"
        strokeWidth={1.1}
      />
      <line
        x1={farRailTop.a[0]}
        y1={farRailTop.a[1]}
        x2={farRailTop.b[0]}
        y2={farRailTop.b[1]}
        className="stroke-foreground"
        strokeWidth={1.6}
        strokeLinecap="round"
      />

      {/* the coin rides between the rails, then seats in the cup */}
      <g data-stake-coin opacity={rest.coinOpacity}>
        <Coin
          x={STAKE.coinCup[0]}
          y={STAKE.coinCup[1]}
          z={STAKE.coinCup[2]}
          r={STAKE.coinRadius}
          thickness={1.2}
          signal
        />
      </g>

      <line
        x1={nearRailTop.a[0]}
        y1={nearRailTop.a[1]}
        x2={nearRailTop.b[0]}
        y2={nearRailTop.b[1]}
        className="stroke-foreground"
        strokeWidth={1.6}
        strokeLinecap="round"
      />

      {/* the strike flash at the die */}
      <ellipse
        data-stake-flash
        {...disc(STAKE.die.x, STAKE.die.y, 1.79, 0.55)}
        opacity={0}
        className="fill-none stroke-signal"
        strokeWidth={1.2}
      />

      {/* the hand wheel on the screw */}
      <line
        x1={screen([STAKE.wheel.x, STAKE.wheel.y, 5.65])[0]}
        y1={screen([STAKE.wheel.x, STAKE.wheel.y, 5.65])[1]}
        x2={WHEEL_CENTRE[0]}
        y2={WHEEL_CENTRE[1]}
        className="stroke-foreground"
        strokeWidth={1.4}
      />
      <ellipse
        cx={WHEEL.cx}
        cy={WHEEL.cy}
        rx={WHEEL.rx}
        ry={WHEEL.ry}
        className="fill-none stroke-foreground"
        strokeWidth={1.6}
      />
      {[0, 1, 2, 3].map((index) => {
        const angle = rest.wheel + (Math.PI / 2) * index;
        const end = screen([
          STAKE.wheel.x + Math.cos(angle) * STAKE.wheel.r,
          STAKE.wheel.y + Math.sin(angle) * STAKE.wheel.r,
          STAKE.wheel.z,
        ]);
        return (
          <line
            key={index}
            data-stake-spoke
            x1={WHEEL_CENTRE[0]}
            y1={WHEEL_CENTRE[1]}
            x2={end[0]}
            y2={end[1]}
            className="stroke-foreground"
            strokeWidth={1}
          />
        );
      })}
      <ellipse cx={WHEEL.cx} cy={WHEEL.cy} rx={2.2} ry={1.3} className="fill-foreground" />
      {(() => {
        const angle = rest.wheel + Math.PI / 4;
        const rim = screen([
          STAKE.wheel.x + Math.cos(angle) * STAKE.wheel.r,
          STAKE.wheel.y + Math.sin(angle) * STAKE.wheel.r,
          STAKE.wheel.z,
        ]);
        const end = screen([
          STAKE.wheel.x + Math.cos(angle) * (STAKE.wheel.r + 0.16),
          STAKE.wheel.y + Math.sin(angle) * (STAKE.wheel.r + 0.16),
          STAKE.wheel.z,
        ]);
        return (
          <>
            <line
              data-stake-crank
              x1={rim[0]}
              y1={rim[1]}
              x2={end[0]}
              y2={end[1]}
              className="stroke-foreground"
              strokeWidth={2}
              strokeLinecap="round"
            />
            <circle
              data-stake-knob
              cx={end[0]}
              cy={end[1]}
              r={2.8}
              className="fill-background stroke-foreground"
              strokeWidth={1.1}
            />
          </>
        );
      })()}
    </svg>
  );
}

/** One forecast, one window, one number. */
export function NumberArt() {
  const faceY = -0.2;

  const face = (x: number, z: number): [number, number] => screen([x, faceY, z]);
  const ink = (x: number, z: number): [number, number] => screen([x, faceY + 0.01, z]);

  const [leverX, leverY] = screen([1.6, -1.05, 2.9]);
  const [knobX, knobY] = screen([2.45, -1.05, 2.78]);

  const window = flat([
    [-1.55, faceY, 2.05],
    [1.45, faceY, 2.05],
    [1.45, faceY, 3.95],
    [-1.55, faceY, 3.95],
  ]);
  const tile = flat([
    [-0.85, faceY, 2.3],
    [0.75, faceY, 2.3],
    [0.75, faceY, 3.7],
    [-0.85, faceY, 3.7],
  ]);

  const [digitBase, digitBaseY] = ink(-0.15, 2.45);
  const [digitTopX, digitTopY] = ink(-0.15, 3.5);
  const [flagX, flagY] = ink(-0.45, 3.25);
  const [footLeftX, footLeftY] = ink(-0.45, 2.45);
  const [footRightX, footRightY] = ink(0.25, 2.45);

  return (
    <svg
      viewBox={ISO_VIEWBOX}
      className="w-full"
      role="presentation"
      aria-hidden="true"
      focusable="false"
    >
      <Plate />

      {/* cabinet, cap and feet */}
      <Slab x={-2.75} y={-2.05} z={0.8} w={4.5} d={1.95} h={0.35} />
      <Slab x={-2.6} y={-1.9} z={1.15} w={4.2} d={1.7} h={3.55} />
      <Slab x={-2.7} y={-2} z={4.7} w={4.4} d={1.9} h={0.25} />

      {/* the one window */}
      <polygon
        points={window}
        className="fill-foreground/[0.06] stroke-foreground"
        strokeWidth={1}
      />
      <polygon points={tile} className="fill-signal stroke-signal" strokeWidth={1} />

      {/* the single figure */}
      <g
        className="stroke-background"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1={digitBase} y1={digitBaseY} x2={digitTopX} y2={digitTopY} />
        <line x1={digitTopX} y1={digitTopY} x2={flagX} y2={flagY} />
        <line x1={footLeftX} y1={footLeftY} x2={footRightX} y2={footRightY} />
      </g>

      {/* hinge line on the tile */}
      <line
        x1={face(-0.85, 3.55)[0]}
        y1={face(-0.85, 3.55)[1]}
        x2={face(0.75, 3.55)[0]}
        y2={face(0.75, 3.55)[1]}
        className="stroke-background/40"
        strokeWidth={0.8}
      />

      {/* label plate and vents on the face */}
      <polygon
        points={flat([
          [-1.0, faceY, 4.05],
          [1.0, faceY, 4.05],
          [1.0, faceY, 4.4],
          [-1.0, faceY, 4.4],
        ])}
        className="fill-background stroke-foreground/30"
        strokeWidth={0.8}
      />
      {[4.16, 4.3].map((z, i) => {
        const [x1, y1] = face(-0.55, z);
        const [x2, y2] = face(i === 0 ? 0.35 : 0.55, z);
        return (
          <line
            key={z}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            className="stroke-foreground/30"
            strokeWidth={0.7}
          />
        );
      })}
      {[1.35, 1.6, 1.85].map((z) => {
        const [x1, y1] = face(-1.0, z);
        const [x2, y2] = face(0.8, z);
        return (
          <line
            key={z}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            className="stroke-foreground/25"
            strokeWidth={0.7}
          />
        );
      })}

      {/* the advance lever */}
      <line
        x1={leverX}
        y1={leverY}
        x2={knobX}
        y2={knobY}
        className="stroke-foreground"
        strokeWidth={2.2}
        strokeLinecap="round"
      />
      <circle
        cx={knobX}
        cy={knobY}
        r={2.9}
        className="fill-background stroke-foreground"
        strokeWidth={1.1}
      />
    </svg>
  );
}

/** A question posted in public, dated, and stamped. */
export function NoticeArt() {
  const faceY = -1.63;

  const onBoard = (x: number, z: number): [number, number] => screen([x, faceY, z]);

  return (
    <svg
      viewBox={ISO_VIEWBOX}
      className="w-full"
      role="presentation"
      aria-hidden="true"
      focusable="false"
    >
      <Plate />

      {/* the two posts, flanking the board */}
      <Slab x={-3.05} y={-2.6} z={0.8} w={0.45} d={0.45} h={4.2} />
      <Slab x={2.6} y={-2.6} z={0.8} w={0.45} d={0.45} h={4.2} />
      <Slab x={-3.15} y={-2.75} z={0.8} w={0.75} d={0.75} h={0.3} />
      <Slab x={2.4} y={-2.75} z={0.8} w={0.75} d={0.75} h={0.3} />

      {/* the board and its frame */}
      <Slab x={-2.5} y={-2.15} z={2.9} w={5} d={0.5} h={2.1} />
      <Slab x={-2.6} y={-2.25} z={5} w={5.2} d={0.7} h={0.2} />

      {/* the pinned sheet */}
      <polygon
        points={flat([
          [-1.85, faceY, 3.3],
          [1.6, faceY, 3.3],
          [1.6, faceY, 4.6],
          [-1.85, faceY, 4.6],
        ])}
        className="fill-background stroke-foreground"
        strokeWidth={0.9}
      />
      {[4.35, 4.05, 3.75].map((z, i) => {
        const [x1, y1] = onBoard(-1.5, z);
        const [x2, y2] = onBoard(i === 2 ? 0.1 : 1.2, z);
        return (
          <line
            key={z}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            className="stroke-foreground/30"
            strokeWidth={0.8}
          />
        );
      })}
      <line
        x1={onBoard(-1.5, 3.52)[0]}
        y1={onBoard(-1.5, 3.52)[1]}
        x2={onBoard(0.9, 3.52)[0]}
        y2={onBoard(0.9, 3.52)[1]}
        className="stroke-foreground/20"
        strokeWidth={0.7}
      />
      {(
        [
          [-2.35, 3.05],
          [2.35, 3.05],
          [-2.35, 4.85],
          [2.35, 4.85],
        ] as const
      ).map(([x, z]) => (
        <circle
          key={`${x}-${z}`}
          cx={onBoard(x, z)[0]}
          cy={onBoard(x, z)[1]}
          r={1.1}
          className="fill-foreground/35"
        />
      ))}

      {/* the date slip and its pin */}
      <polygon
        points={flat([
          [0.9, faceY, 3.4],
          [1.45, faceY, 3.4],
          [1.45, faceY, 3.95],
          [0.9, faceY, 3.95],
        ])}
        className="fill-background stroke-foreground/40"
        strokeWidth={0.7}
      />
      <circle
        cx={onBoard(1.18, 3.82)[0]}
        cy={onBoard(1.18, 3.82)[1]}
        r={1.9}
        className="fill-signal stroke-signal"
      />

      {/* the stamp and its ink pad, waiting on the plate */}
      <Slab x={-3} y={0.7} z={0.8} w={1.6} d={1.5} h={0.35} />
      <polygon
        points={flat([
          [-2.8, 0.9, 1.16],
          [-1.6, 0.9, 1.16],
          [-1.6, 1.95, 1.16],
          [-2.8, 1.95, 1.16],
        ])}
        className="fill-foreground/30 stroke-foreground/40"
        strokeWidth={0.7}
      />
      <Slab x={1.1} y={0.8} z={0.8} w={1.65} d={1.35} h={0.5} />
      <Slab x={1.2} y={0.9} z={1.3} w={1.45} d={1.15} h={0.08} />
      <Slab x={1.65} y={1.25} z={1.38} w={0.45} d={0.45} h={1.15} />
      <ellipse
        {...disc(1.875, 1.475, 2.5, 0.38)}
        className="fill-foreground/15 stroke-foreground"
        strokeWidth={1}
      />
      <ellipse
        {...disc(1.875, 1.475, 2.58, 0.38)}
        className="fill-background stroke-foreground"
        strokeWidth={1}
      />

      {/* the finials */}
      <Slab x={-3.05} y={-2.6} z={5} w={0.45} d={0.45} h={0.35} />
      <Slab x={2.6} y={-2.6} z={5} w={0.45} d={0.45} h={0.35} />
    </svg>
  );
}
