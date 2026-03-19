import { NextRequest, NextResponse } from "next/server";
import { getEnv } from "../env.config";

const env = await getEnv();

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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Если это /setup — всегда пропускаем (нужно чтобы setup прошё
  if (pathname === "/setup") {
    // If token - redirect to dashboard
    const token = checkToken(request);
    if (token) {
      return NextResponse.redirect(new URL(`/`, request.url));
    }

    const init = await checkSetup();

    if (init) {
      return NextResponse.redirect(new URL(`/login`, request.url));
    }

    return NextResponse.next();
  }

  // Если это /login — нужно проверить, сделан ли setup
  if (pathname === "/login") {
    // If token - redirect to dashboard
    const token = checkToken(request);
    if (token) {
      return NextResponse.redirect(new URL(`/`, request.url));
    }

    const init = await checkSetup();

    if (init) {
      return NextResponse.next();
    }

    return NextResponse.redirect(new URL(`/setup`, request.url));
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
    return NextResponse.redirect(new URL(`/login`, request.url));
  }

  // If no setup - redirect to setup
  return NextResponse.redirect(new URL(`/setup`, request.url));
}

export const config = {
  matcher: ["/((?!api|trpc|_next|_vercel|.*\\..*).*)"],
};
