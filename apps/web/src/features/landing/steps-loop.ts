"use client";

import * as React from "react";

type Frame = (phase: number) => void;

/**
 * Drives one station on the plate. The station is painted once at rest for the
 * server and again for `prefers-reduced-motion`; otherwise it loops on a single
 * rAF clock while it is on screen and the tab is visible.
 *
 * `create` reads the settled markup once and returns the per-frame painter.
 */
export function useStepsLoop(
  duration: number,
  still: number,
  create: (root: SVGSVGElement) => Frame,
) {
  const root = React.useRef<SVGSVGElement | null>(null);
  const painter = React.useRef(create);

  React.useEffect(() => {
    painter.current = create;
  });

  React.useEffect(() => {
    const node = root.current;
    if (!node) return;

    const draw = painter.current(node);
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reduced = motion.matches;
    let visible = false;
    let frame = 0;
    let started = 0;
    let phase = 0;

    const paint = (value: number) => {
      phase = value;
      draw(value);
    };

    paint(reduced ? still : 0);

    const tick = (now: number) => {
      if (!started) started = now;
      paint(((now - started) / duration) % 1);
      frame = requestAnimationFrame(tick);
    };

    const canRun = () => visible && !reduced && document.visibilityState !== "hidden";

    const start = () => {
      if (frame || !canRun()) return;
      started = performance.now() - phase * duration;
      frame = requestAnimationFrame(tick);
    };

    const stop = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
    };

    const observer = new IntersectionObserver(
      (entries) => {
        visible = Boolean(entries.at(-1)?.isIntersecting);
        if (visible) start();
        else stop();
      },
      { rootMargin: "120px 0px", threshold: 0.05 },
    );
    observer.observe(node);

    const onVisibility = () => {
      if (document.visibilityState === "hidden") stop();
      else start();
    };
    const onMotion = () => {
      reduced = motion.matches;
      if (reduced) {
        stop();
        paint(still);
      } else {
        start();
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
    motion.addEventListener("change", onMotion);

    return () => {
      stop();
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      motion.removeEventListener("change", onMotion);
    };
  }, [duration, still]);

  return root;
}
