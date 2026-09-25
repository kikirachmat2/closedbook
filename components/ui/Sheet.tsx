"use client";

import React from "react";
import BottomSheet, { BottomSheetProps } from "@/components/mobile/BottomSheet";

export interface SheetProps extends Omit<BottomSheetProps, "children"> {
  children?: React.ReactNode;
}

export const Sheet: React.FC<SheetProps> = (props) => {
  return <BottomSheet {...props}>{props.children}</BottomSheet>;
};

export default Sheet;
