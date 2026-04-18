const normalizedBasePath = (process.env.NEXT_PUBLIC_ADMIN_BASE_PATH || "")
  .trim()
  .replace(/\/$/, "");

export function withBasePath(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return normalizedBasePath ? `${normalizedBasePath}${normalizedPath}` : normalizedPath;
}
