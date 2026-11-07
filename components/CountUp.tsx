"use client";
// Animates a dollar amount counting up from 0 when it first appears or changes.
import { useEffect, useState } from "react";
import { formatUsd } from "@/components/ChargeCard";

export function CountUp({ value, duration = 900 }: { value: number; duration?: number }) {
  const [shown, setShown] = useState(value);

  useEffect(() => {
    // Reduced motion: jump straight to the final value (still set inside the animation frame callback).
    const length = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : duration;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = length === 0 ? 1 : Math.min(1, (now - start) / length);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out
      setShown(value * eased);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);

  return <>{formatUsd(shown)}</>;
}
