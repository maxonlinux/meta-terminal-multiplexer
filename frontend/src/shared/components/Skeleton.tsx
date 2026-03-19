// components/ui/skeleton.tsx
import { cls } from "@/shared/utils";
import React from "react";

type SkeletonProps = {
  className?: string;
};

export const Skeleton: React.FC<SkeletonProps> = ({ className }) => {
  const baseStyles = "bg-neutral-900 animate-pulse";

  return <div className={cls(baseStyles, className)} />;
};
