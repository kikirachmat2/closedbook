"use client";

import React from "react";
import { motion, AnimatePresence, useReducedMotion, Transition } from "framer-motion";

export type TransitionType = "tab-switch" | "forward" | "back" | "modal";

interface PageTransitionProps {
  transitionKey: string;
  type?: TransitionType;
  children: React.ReactNode;
  className?: string;
}

const CUBIC_EASE = [0.16, 1, 0.3, 1] as const;

/**
 * PageTransition — Framer Motion page & tab transitions adhering to Jakob's Law & Doherty Threshold:
 * - tab-switch: 150ms cross-fade
 * - forward: 220ms slide from right
 * - back: 200ms slide to right
 * - modal: 220ms slide from bottom
 * - reduced-motion: 0.001s instant fade
 */
export default function PageTransition({
  transitionKey,
  type = "tab-switch",
  children,
  className = "",
}: PageTransitionProps) {
  const shouldReduceMotion = useReducedMotion();

  const getVariants = (): {
    initial: Record<string, any>;
    animate: Record<string, any>;
    exit: Record<string, any>;
    transition: Transition;
  } => {
    if (shouldReduceMotion) {
      return {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.001 },
      };
    }

    switch (type) {
      case "forward":
        return {
          initial: { opacity: 0, x: 24 },
          animate: { opacity: 1, x: 0 },
          exit: { opacity: 0, x: -24 },
          transition: { duration: 0.22, ease: CUBIC_EASE },
        };

      case "back":
        return {
          initial: { opacity: 0, x: -24 },
          animate: { opacity: 1, x: 0 },
          exit: { opacity: 0, x: 24 },
          transition: { duration: 0.20, ease: CUBIC_EASE },
        };

      case "modal":
        return {
          initial: { opacity: 0, y: 32 },
          animate: { opacity: 1, y: 0 },
          exit: { opacity: 0, y: 32 },
          transition: { duration: 0.22, ease: CUBIC_EASE },
        };

      case "tab-switch":
      default:
        return {
          initial: { opacity: 0, scale: 0.99 },
          animate: { opacity: 1, scale: 1 },
          exit: { opacity: 0, scale: 0.99 },
          transition: { duration: 0.15, ease: "easeOut" },
        };
    }
  };

  const variants = getVariants();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={transitionKey}
        data-testid="page-transition-container"
        data-transition-type={type}
        initial={variants.initial}
        animate={variants.animate}
        exit={variants.exit}
        transition={variants.transition}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
