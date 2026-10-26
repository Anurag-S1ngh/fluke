"use client";

import { Coin, disc, flat, Plate, screen, Slab, type Point } from "./mini-iso";
import { useStepsLoop } from "./steps-loop";
import {
  BALLOT_LOOP,
  ballotPose,
  BEAM_LOOP,
  beamPose,
  PAN_REF_Z,
  type BeamSide,
} from "./steps-motion";

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
  const rest = beamPose(0);
  const leftWeight = { x: -2.75, y: 1.85, w: 0.9, d: 0.9, h: 0.5 };
  const rightWeight = { x: 1.85, y: -2.75, w: 0.9, d: 0.9, h: 0.7 };

  const loop = useStepsLoop(BEAM_LOOP, 0, (root) => {
    const beam = root.querySelector<SVGLineElement>("[data-beam]");
    const leftHang = root.querySelector<SVGLineElement>("[data-left-hang]");
    const rightHang = root.querySelector<SVGLineElement>("[data-right-hang]");
    const leftPan = root.querySelector<SVGEllipseElement>("[data-left-pan]");
    const rightPan = root.querySelector<SVGEllipseElement>("[data-right-pan]");
    const leftRim = root.querySelector<SVGEllipseElement>("[data-left-rim]");
    const rightRim = root.querySelector<SVGEllipseElement>("[data-right-rim]");
    const leftOrder = root.querySelector<SVGGElement>("[data-left-order]");
    const rightOrder = root.querySelector<SVGGElement>("[data-right-order]");
    if (
      !beam ||
      !leftHang ||
      !rightHang ||
      !leftPan ||
      !rightPan ||
      !leftRim ||
      !rightRim ||
      !leftOrder ||
      !rightOrder
    )
      return () => {};

    const place = (
      side: BeamSide,
      hang: SVGLineElement,
      pan: SVGEllipseElement,
      rim: SVGEllipseElement,
      order: SVGGElement,
    ) => {
      hang.setAttribute("x1", String(side.end[0]));
      hang.setAttribute("y1", String(side.end[1]));
      hang.setAttribute("x2", String(side.pan.cx));
      hang.setAttribute("y2", String(side.pan.cy));
      pan.setAttribute("cx", String(side.pan.cx));
      pan.setAttribute("cy", String(side.pan.cy));
      pan.setAttribute("rx", String(side.pan.rx));
      pan.setAttribute("ry", String(side.pan.ry));
      rim.setAttribute("cx", String(side.rim.cx));
      rim.setAttribute("cy", String(side.rim.cy));
      rim.setAttribute("rx", String(side.rim.rx));
      rim.setAttribute("ry", String(side.rim.ry));
      order.setAttribute("transform", `translate(0 ${side.weightDy.toFixed(2)})`);
      order.setAttribute("opacity", String(side.weightOpacity));
    };

    return (phase) => {
      const pose = beamPose(phase);
      beam.setAttribute("x1", String(pose.left.end[0]));
      beam.setAttribute("y1", String(pose.left.end[1]));
      beam.setAttribute("x2", String(pose.right.end[0]));
      beam.setAttribute("y2", String(pose.right.end[1]));
      place(pose.left, leftHang, leftPan, leftRim, leftOrder);
      place(pose.right, rightHang, rightPan, rightRim, rightOrder);
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

      {/* what the pans cast on the plate */}
      <ellipse {...disc(-2.3, 2.3, 0.82, 1.05)} className="fill-foreground/[0.05]" />
      <ellipse {...disc(2.3, -2.3, 0.82, 1.05)} className="fill-foreground/[0.05]" />

      <Slab x={-0.75} y={-0.75} z={0.8} w={1.5} d={1.5} h={3.2} />

      {/* the beam, tipped by the load */}
      <line
        data-beam
        x1={rest.left.end[0]}
        y1={rest.left.end[1]}
        x2={rest.right.end[0]}
        y2={rest.right.end[1]}
        className="stroke-foreground"
        strokeWidth={4.4}
        strokeLinecap="round"
      />

      {/* the pans, hung from the beam ends */}
      <line
        data-left-hang
        x1={rest.left.end[0]}
        y1={rest.left.end[1]}
        x2={rest.left.pan.cx}
        y2={rest.left.pan.cy}
        className="stroke-foreground/60"
        strokeWidth={1}
      />
      <line
        data-right-hang
        x1={rest.right.end[0]}
        y1={rest.right.end[1]}
        x2={rest.right.pan.cx}
        y2={rest.right.pan.cy}
        className="stroke-foreground/60"
        strokeWidth={1}
      />
      <ellipse
        data-left-pan
        {...rest.left.pan}
        className="fill-background stroke-foreground"
        strokeWidth={1}
      />
      <ellipse
        data-right-pan
        {...rest.right.pan}
        className="fill-background stroke-foreground"
        strokeWidth={1}
      />
      <ellipse
        data-left-rim
        {...rest.left.rim}
        className="fill-none stroke-foreground/30"
        strokeWidth={0.8}
      />
      <ellipse
        data-right-rim
        {...rest.right.rim}
        className="fill-none stroke-foreground/30"
        strokeWidth={0.8}
      />
      <Coin x={0} y={0} z={4.35} r={0.52} />

      {/* the order on each pan */}
      <g data-left-order>
        <Slab {...leftWeight} z={PAN_REF_Z} />
      </g>
      <g data-right-order>
        <Slab {...rightWeight} z={PAN_REF_Z} signal />
      </g>
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
