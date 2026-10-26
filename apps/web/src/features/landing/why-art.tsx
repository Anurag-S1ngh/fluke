import { Coin, disc, flat, ISO_VIEWBOX, Plate, screen, Slab } from "./mini-iso";

/** A stake is real money pressed onto the claim, not a raised hand. */
export function StakeArt() {
  const wheel = disc(0.5, -0.95, 6.12, 0.8);
  const [spindleTopX, spindleTopY] = screen([0.5, -0.95, 5.8]);
  const crankX = wheel.cx + wheel.rx + 6;
  const crankY = wheel.cy - 2;

  return (
    <svg
      viewBox={ISO_VIEWBOX}
      className="w-full"
      role="presentation"
      aria-hidden="true"
      focusable="false"
    >
      <Plate />

      {/* the platen and its stack of receipts */}
      <Slab x={-2.5} y={-2} z={0.8} w={4.2} d={3.8} h={0.9} />
      <polygon
        points={flat([
          [-2.2, -1.7, 1.71],
          [1.4, -1.7, 1.71],
          [1.4, 1.5, 1.71],
          [-2.2, 1.5, 1.71],
        ])}
        className="fill-none stroke-foreground/20"
        strokeWidth={0.8}
      />
      <Slab x={-1.3} y={-1.55} z={1.7} w={2.9} d={2.7} h={0.07} />
      <Slab x={-1.25} y={-1.5} z={1.77} w={2.8} d={2.6} h={0.13} />

      {/* the printed lines on the slip */}
      {[0.2, 0.5, 0.8].map((y, i) => {
        const [x1, y1] = screen([0.3, y, 1.91]);
        const [x2, y2] = screen([i === 2 ? 1 : 1.35, y, 1.91]);
        return (
          <line
            key={y}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            className="stroke-foreground/40"
            strokeWidth={1}
          />
        );
      })}

      {/* the coin that backs the claim */}
      <Coin x={0.45} y={-0.85} z={1.9} r={0.65} signal />

      {/* the press: column, arm, ram, stamp */}
      <Slab x={-2.2} y={-1.7} z={1.7} w={0.9} d={1} h={3.55} />
      <Slab x={-2.2} y={-1.7} z={5.25} w={3.4} d={1} h={0.55} />
      <Slab x={0.2} y={-1.25} z={3.05} w={0.65} d={0.8} h={2.2} />
      <Slab x={0} y={-1.35} z={2.55} w={1} d={1.05} h={0.5} />
      <Slab x={0.35} y={-1.15} z={5.8} w={0.3} d={0.3} h={0.25} />

      {/* the hand wheel */}
      <line
        x1={spindleTopX}
        y1={spindleTopY}
        x2={wheel.cx}
        y2={wheel.cy}
        className="stroke-foreground"
        strokeWidth={1.2}
      />
      <ellipse
        cx={wheel.cx}
        cy={wheel.cy}
        rx={wheel.rx}
        ry={wheel.ry}
        className="fill-none stroke-foreground"
        strokeWidth={1.6}
      />
      <ellipse cx={wheel.cx} cy={wheel.cy} rx={2.2} ry={1.3} className="fill-foreground" />
      {[0, 1, 2].map((i) => {
        const angle = (Math.PI / 3) * i;
        return (
          <line
            key={i}
            x1={wheel.cx}
            y1={wheel.cy}
            x2={wheel.cx + Math.cos(angle) * wheel.rx}
            y2={wheel.cy + Math.sin(angle) * wheel.ry}
            className="stroke-foreground"
            strokeWidth={1}
          />
        );
      })}

      {/* the crank handle on the wheel rim */}
      <line
        x1={wheel.cx + wheel.rx - 1}
        y1={wheel.cy + 1}
        x2={crankX}
        y2={crankY}
        className="stroke-foreground"
        strokeWidth={2}
        strokeLinecap="round"
      />
      <circle
        cx={crankX}
        cy={crankY}
        r={2.8}
        className="fill-background stroke-foreground"
        strokeWidth={1.2}
      />
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
