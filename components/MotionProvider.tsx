"use client";

import React from "react";
import { LazyMotion, domAnimation } from "framer-motion";

export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      {children}
    </LazyMotion>
  );
}

export { m, AnimatePresence } from "framer-motion";
