"use client";

import React, { forwardRef } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface DividerProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical";
}

export const Divider = forwardRef<HTMLDivElement, DividerProps>(
  ({ className, orientation = "horizontal", ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="separator"
        aria-orientation={orientation}
        className={twMerge(
          clsx(
            "bg-[var(--cb-border)] shrink-0",
            orientation === "horizontal" ? "h-[1px] w-full my-3" : "w-[1px] h-full mx-2 self-stretch",
            className
          )
        )}
        {...props}
      />
    );
  }
);

Divider.displayName = "Divider";
