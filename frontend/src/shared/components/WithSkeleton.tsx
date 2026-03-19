import { ReactNode } from "react";

// Helper type to ensure that each property of the object is non-nullable
type NonNullableObject<T extends Record<string, unknown>> = {
  [K in keyof T]: NonNullable<T[K]>;
};

type WithSkeletonProps<T extends Record<string, unknown>> = {
  data: T | null | undefined;
  skeleton: ReactNode;
  children: (data: NonNullableObject<T>) => ReactNode;
};

export function WithSkeleton<T extends Record<string, unknown>>({
  data,
  skeleton,
  children,
}: WithSkeletonProps<T>) {
  // Check if data is missing or any of its keys are nullish
  if (
    !data ||
    Object.values(data).some((value) => value === null || value === undefined)
  ) {
    return <>{skeleton}</>;
  }

  // data is defined, and all its properties are non-null
  return <>{children(data as NonNullableObject<T>)}</>;
}
