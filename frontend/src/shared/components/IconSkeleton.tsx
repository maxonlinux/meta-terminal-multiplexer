// components/ui/skeleton.tsx
import { cls } from "@/shared/utils";
import React from "react";

type SkeletonProps = {
  className?: string;
  icon: React.ComponentType<{ className?: string }>;
};

export const IconSkeleton: React.FC<SkeletonProps> = ({
  className = "",
  icon: Icon,
}) => {
  const baseStyles = "text-neutral-900 animate-pulse";

  return <Icon className={cls(baseStyles, className)} />;
};
