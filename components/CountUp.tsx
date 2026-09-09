"use client";

import React, { useEffect, useState } from "react";

interface CountUpProps {
  end: number;
  duration?: number; // duration in ms
  formatter?: (val: number) => string;
  className?: string;
}

export default function CountUp({
  end,
  duration = 900,
  formatter = (v) => v.toLocaleString(),
  className = "",
}: CountUpProps) {
  const [current, setCurrent] = useState<number>(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Quad ease-out formula
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(easeOut * end));

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setCurrent(end);
      }
    };

    animationFrameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrameId);
  }, [end, duration]);

  return <span className={className}>{formatter(current)}</span>;
}
