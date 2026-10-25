const rawBasePath = process.env.NEXT_PUBLIC_BASE_PATH?.trim() ?? "";

/**
 * Prefix used when the app is served from a sub-path (GitHub Pages project site).
 * It must stay empty for local, Vercel and Capacitor builds.
 */
export const BASE_PATH =
  rawBasePath && rawBasePath !== "/"
    ? `/${rawBasePath.replace(/^\/+|\/+$/g, "")}`
    : "";

export function withBasePath(path: string): string {
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${BASE_PATH}${suffix}`;
}

/**
 * Keeps route comparisons stable whether the router reports the base path or not.
 */
export function stripBasePath(pathname: string): string {
  if (!BASE_PATH) return pathname;
  if (pathname === BASE_PATH) return "/";
  if (pathname.startsWith(`${BASE_PATH}/`)) {
    return pathname.slice(BASE_PATH.length);
  }
  return pathname;
}
