import { NextRequest, NextResponse } from "next/server";
import { getEnv } from "../env.config";

const env = await getEnv();
const adminBasePath = env.ADMIN_BASE_PATH || "";

async function checkSetup() {
  const res = await fetch(
    `${env.MULTIPLEXER_URL}/admin/auth/status`,
    {
      cache: "no-store",
    }
  );

  const data = await res.json();

  if (data.initialized) {
    return true;
  }

  return false;
}

function checkToken(request: NextRequest) {
  const token = request.cookies.get("meta_multiplexer_token");
  return !!token?.value;
}

function stripBasePath(pathname: string) {
  if (!adminBasePath || adminBasePath === "/") {
    return pathname;
  }
  if (!pathname.startsWith(adminBasePath)) {
    return pathname;
  }
  const stripped = pathname.slice(adminBasePath.length);
  return stripped === "" ? "/" : stripped;
}

function withBasePath(path: string) {
  if (!adminBasePath || adminBasePath === "/") {
    return path;
  }
  if (path === "/") {
    return adminBasePath;
  }
  return `${adminBasePath}${path}`;
}

function redirectTo(request: NextRequest, path: string) {
  const url = request.nextUrl.clone();
  url.pathname = withBasePath(path);
  url.search = "";
  return NextResponse.redirect(url);
}

export async function middleware(request: NextRequest) {
  const pathname = stripBasePath(request.nextUrl.pathname);

  // Если это /setup — всегда пропускаем (нужно чтобы setup прошё
  if (pathname === "/setup") {
    // If token - redirect to dashboard
    const token = checkToken(request);
    if (token) {
      return redirectTo(request, "/");
    }

    const init = await checkSetup();

    if (init) {
      return redirectTo(request, "/login");
    }

    return NextResponse.next();
  }

  // Если это /login — нужно проверить, сделан ли setup
  if (pathname === "/login") {
    // If token - redirect to dashboard
    const token = checkToken(request);
    if (token) {
      return redirectTo(request, "/");
    }

    const init = await checkSetup();

    if (init) {
      return NextResponse.next();
    }

    return redirectTo(request, "/setup");
  }

  // Для остальных путей — проверяем токен
  const token = checkToken(request);

  if (token) {
    // Токен есть — пропускаем
    return NextResponse.next();
  }

  // Нет токена — проверяем setup
  const init = await checkSetup();

  // If setup - redirect to login
  if (init) {
    return redirectTo(request, "/login");
  }

  // If no setup - redirect to setup
  return redirectTo(request, "/setup");
}

export const config = {
  matcher: ["/((?!api|trpc|_next|_vercel|.*\\..*).*)"],
};
