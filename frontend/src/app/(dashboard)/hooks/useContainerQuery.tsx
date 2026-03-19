import { useEffect, useState } from "react";

export function useContainerQuery<T extends HTMLElement | null>(
  containerRef: React.RefObject<T>,
  query: (width: number, height: number) => boolean
): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setMatches(query(width, height));
      }
    });

    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
    };
  }, [containerRef, query]);

  return matches;
}
