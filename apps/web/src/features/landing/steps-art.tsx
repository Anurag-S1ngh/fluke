"use client";

import { Coin, disc, flat, Plate, screen, Slab, type Point } from "./mini-iso";
import { useStepsLoop } from "./steps-loop";
import { BALLOT_LOOP, ballotPose } from "./steps-motion";

const BALLOT_PIVOT = screen([0, -0.9, 2.7]);

export function BallotArt() {
  const rest = ballotPose(0);

  const loop = useStepsLoop(BALLOT_LOOP, 0, (root) => {
    const lever = root.querySelector<SVGLineElement>("[data-lever]");
    const tip = root.querySelector<SVGCircleElement>("[data-lever-tip]");
    const yes = root.querySelector<SVGGElement>("[data-side-yes]");
    const no = root.querySelector<SVGGElement>("[data-side-no]");
    if (!lever || !tip || !yes || !no) return () => {};

    return (phase) => {
      const pose = ballotPose(phase);
      lever.setAttribute("x2", String(pose.tip[0]));
      lever.setAttribute("y2", String(pose.tip[1]));
      tip.setAttribute("cx", String(pose.tip[0]));
      tip.setAttribute("cy", String(pose.tip[1]));
      yes.setAttribute("opacity", String(pose.litYes));
      no.setAttribute("opacity", String(pose.litNo));
    };
  });

  return (
    <svg
      ref={loop}
      viewBox="0 0 132 120"
      className="w-full"
      role="presentation"
      aria-hidden="true"
      focusable="false"
    >
      <Plate />

      {/* the two sides, registered on the plate */}
      <Slab x={-3} y={0.8} z={0.8} w={1.7} d={1.7} h={0.7} />
      <g data-side-yes opacity={rest.litYes}>
        <Slab x={-3} y={0.8} z={0.8} w={1.7} d={1.7} h={0.7} signal />
      </g>
      <Slab x={1.5} y={0.9} z={0.8} w={1.5} d={1.5} h={0.55} />
      <g data-side-no opacity={rest.litNo}>
        <Slab x={1.5} y={0.9} z={0.8} w={1.5} d={1.5} h={0.55} signal />
      </g>

      {/* pivot block and its lever, thrown to one side */}
      <Slab x={-1} y={-1.9} z={0.8} w={2} d={2} h={1.9} />
      <line
        data-lever
        x1={BALLOT_PIVOT[0]}
        y1={BALLOT_PIVOT[1]}
        x2={rest.tip[0]}
        y2={rest.tip[1]}
        className="stroke-foreground"
        strokeWidth={4.4}
        strokeLinecap="round"
      />
      <circle
        data-lever-tip
        cx={rest.tip[0]}
        cy={rest.tip[1]}
        r={5.2}
        className="fill-background stroke-foreground"
        strokeWidth={1.2}
      />
      <Coin x={0} y={-0.9} z={2.7} r={0.82} />
    </svg>
  );
}

export function BeamArt() {
  const leftEnd: Point = [-2.3, 2.3, 4.85];
  const rightEnd: Point = [2.3, -2.3, 3.85];
  const [lx, ly] = screen(leftEnd);
  const [rx, ry] = screen(rightEnd);
  const leftPan = disc(-2.3, 2.3, 3.3, 1.12);
  const rightPan = disc(2.3, -2.3, 2.3, 1.12);

  return (
    <svg
      viewBox="0 0 132 120"
      className="w-full"
      role="presentation"
      aria-hidden="true"
      focusable="false"
    >
      <Plate />

      {/* what the pans cast on the plate */}
      <ellipse {...disc(-2.3, 2.3, 0.82, 1.05)} className="fill-foreground/[0.05]" />
      <ellipse {...disc(2.3, -2.3, 0.82, 1.05)} className="fill-foreground/[0.05]" />

      <Slab x={-0.75} y={-0.75} z={0.8} w={1.5} d={1.5} h={3.2} />

      {/* the beam, tipped by the load */}
      <line
        x1={lx}
        y1={ly}
        x2={rx}
        y2={ry}
        className="stroke-foreground"
        strokeWidth={4.4}
        strokeLinecap="round"
      />

      {/* the pans, hung from the beam ends */}
      <line
        x1={lx}
        y1={ly}
        x2={leftPan.cx}
        y2={leftPan.cy}
        className="stroke-foreground/60"
        strokeWidth={1}
      />
      <line
        x1={rx}
        y1={ry}
        x2={rightPan.cx}
        y2={rightPan.cy}
        className="stroke-foreground/60"
        strokeWidth={1}
      />
      <ellipse {...leftPan} className="fill-background stroke-foreground" strokeWidth={1} />
      <ellipse {...rightPan} className="fill-background stroke-foreground" strokeWidth={1} />
      <ellipse
        {...disc(-2.3, 2.3, 3.3, 0.82)}
        className="fill-none stroke-foreground/30"
        strokeWidth={0.8}
      />
      <ellipse
        {...disc(2.3, -2.3, 2.3, 0.82)}
        className="fill-none stroke-foreground/30"
        strokeWidth={0.8}
      />
      <Coin x={0} y={0} z={4.35} r={0.52} />

      {/* the order on each pan */}
      <Slab x={-2.75} y={1.85} z={3.3} w={0.9} d={0.9} h={0.5} />
      <Slab x={1.85} y={-2.75} z={2.3} w={0.9} d={0.9} h={0.7} signal />
    </svg>
  );
}

export function PayoutArt() {
  const [slotX, slotY] = screen([2.4, -0.8, 1.75]);
  const [dropX, dropY] = screen([-1.8, 1.4, 2.9]);

  return (
    <svg
      viewBox="0 0 132 120"
      className="w-full"
      role="presentation"
      aria-hidden="true"
      focusable="false"
    >
      <Plate />

      {/* the paying gate */}
      <Slab x={0.6} y={-3.4} z={0.8} w={2.6} d={2.6} h={2} />
      <polygon
        points={flat([
          [0.85, -3.15, 2.81],
          [2.95, -3.15, 2.81],
          [2.95, -1.05, 2.81],
          [0.85, -1.05, 2.81],
        ])}
        className="fill-none stroke-foreground/25"
        strokeWidth={0.8}
      />
      <polygon
        points={flat([
          [1.3, -0.8, 1.95],
          [2.5, -0.8, 1.95],
          [2.5, -0.8, 1.55],
          [1.3, -0.8, 1.55],
        ])}
        className="fill-foreground/70"
      />

      {/* the tray that catches it */}
      <Slab x={-3.4} y={0.2} z={0.8} w={2.4} d={2.4} h={0.55} />
      <Coin x={-2.3} y={1.3} z={1.38} />
      <Coin x={-2.3} y={1.3} z={1.68} />

      {/* the share on its way down */}
      <path
        d={`M${slotX} ${slotY} Q${slotX - 22} ${slotY + 14} ${dropX + 5} ${dropY - 3}`}
        fill="none"
        className="stroke-signal/60"
        strokeWidth={1}
        strokeDasharray="2 3"
        strokeLinecap="round"
      />
      <Coin x={-1.9} y={1.4} z={3.05} signal />
    </svg>
  );
}
