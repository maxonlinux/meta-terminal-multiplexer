export function buildQueryParams(params: Record<string, unknown>) {
  const cleanParams: {
    [key: string]: string;
  } = {};

  for (const param in params) {
    const value = params[param];

    if (value) {
      cleanParams[param] = String(value);
    }
  }

  return new URLSearchParams(cleanParams);
}
