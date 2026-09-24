"use client";

import React, { forwardRef } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  isRequired?: boolean;
}

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, isRequired = false, children, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={twMerge(
          clsx(
            "block text-[13px] font-medium leading-[18px] text-[var(--cb-text-secondary)] select-none mb-1.5",
            className
          )
        )}
        {...props}
      >
        {children}
        {isRequired && (
          <span className="text-[var(--cb-crimson)] ml-1" aria-hidden="true">
            *
          </span>
        )}
      </label>
    );
  }
);

Label.displayName = "Label";
