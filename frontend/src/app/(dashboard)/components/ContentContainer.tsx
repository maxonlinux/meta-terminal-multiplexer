import { cls } from "@/shared/utils";
import React from "react";

export const ContentContainer = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={cls(
      "flex flex-col min-h-0 bg-black rounded-sm border border-white/10",
      className
    )}
  >
    {children}
  </div>
);
