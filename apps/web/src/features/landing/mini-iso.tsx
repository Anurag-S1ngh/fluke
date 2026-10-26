const U = 10;
const OX = 66;
const OY = 78;
const C = 0.8660254;

export type Point = [number, number, number];

export const ISO_VIEWBOX = "0 0 132 120";

export const screen = ([x, y, z]: Point): [number, number] => [
  OX + (x - y) * C * U,
  OY + (x + y) * 0.5 * U - z * U,
];

export const flat = (points: Point[]) =>
  points
    .map(screen)
    .map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ");

export const disc = (x: number, y: number, z: number, r: number) => {
  const [cx, cy] = screen([x, y, z]);
  return { cx, cy, rx: 1.2247 * r * U, ry: 0.7071 * r * U };
};

/** One solid: two shaded faces and a lit top, painted in order. */
export function Slab({
  x,
  y,
  z,
  w,
  d,
  h,
  signal = false,
}: {
  x: number;
  y: number;
  z: number;
  w: number;
  d: number;
  h: number;
  signal?: boolean;
}) {
  const top: Point[] = [
    [x, y, z + h],
    [x + w, y, z + h],
    [x + w, y + d, z + h],
    [x, y + d, z + h],
  ];
  const left: Point[] = [
    [x, y + d, z + h],
    [x + w, y + d, z + h],
    [x + w, y + d, z],
    [x, y + d, z],
  ];
  const right: Point[] = [
    [x + w, y, z + h],
    [x + w, y + d, z + h],
    [x + w, y + d, z],
    [x + w, y, z],
  ];

  return (
    <g strokeWidth={1} strokeLinejoin="round">
      <polygon
        points={flat(left)}
        className={
          signal ? "fill-signal/80 stroke-signal" : "fill-foreground/[0.08] stroke-foreground"
        }
      />
      <polygon
        points={flat(right)}
        className={
          signal ? "fill-signal/65 stroke-signal" : "fill-foreground/[0.16] stroke-foreground"
        }
      />
      <polygon
        points={flat(top)}
        className={signal ? "fill-signal stroke-signal" : "fill-background stroke-foreground"}
      />
    </g>
  );
}

export function Coin({
  x,
  y,
  z,
  r = 0.8,
  signal = false,
}: {
  x: number;
  y: number;
  z: number;
  r?: number;
  signal?: boolean;
}) {
  const { cx, cy, rx, ry } = disc(x, y, z, r);
  return (
    <g strokeWidth={1} className={signal ? "stroke-signal" : "stroke-foreground"}>
      <ellipse
        cx={cx}
        cy={cy + 2.8}
        rx={rx}
        ry={ry}
        className={signal ? "fill-signal/60" : "fill-foreground/15"}
      />
      <ellipse
        cx={cx}
        cy={cy}
        rx={rx}
        ry={ry}
        className={signal ? "fill-signal" : "fill-background"}
      />
    </g>
  );
}

/** The machined base every station sits on: a groove and four corner screws. */
export function Plate() {
  return (
    <>
      <Slab x={-3.6} y={-3.6} z={0} w={7.2} d={7.2} h={0.8} />
      <polygon
        points={flat([
          [-3.3, -3.3, 0.81],
          [3.3, -3.3, 0.81],
          [3.3, 3.3, 0.81],
          [-3.3, 3.3, 0.81],
        ])}
        className="fill-none stroke-foreground/20"
        strokeWidth={0.8}
      />
      {(
        [
          [-3, -3],
          [2.85, -3],
          [-3, 2.85],
          [2.85, 2.85],
        ] as const
      ).map(([x, y]) => (
        <ellipse key={`${x}-${y}`} {...disc(x, y, 0.82, 0.12)} className="fill-foreground/35" />
      ))}
    </>
  );
}
