import { type NextRequest, NextResponse } from "next/server";

const ADMIN_COOKIE_NAME = "meta_multiplexer_token";
const ADMIN_BASE_PATH = process.env.ADMIN_BASE_PATH || "";
const MULTIPLEXER_URL = process.env.MULTIPLEXER_URL;

function stripBasePath(pathname: string) {
	if (!ADMIN_BASE_PATH) return pathname;
	if (pathname === ADMIN_BASE_PATH) return "/";
	if (pathname.startsWith(`${ADMIN_BASE_PATH}/`)) {
		return pathname.slice(ADMIN_BASE_PATH.length);
	}
	return pathname;
}

async function checkSetup() {
	if (!MULTIPLEXER_URL) {
		return true;
	}

	const res = await fetch(`${MULTIPLEXER_URL}/admin/auth/status`, {
		cache: "no-store",
	});

	if (!res.ok) {
		return true;
	}

	const data = (await res.json()) as { initialized?: boolean } | null;
	return data?.initialized !== false;
}

function checkToken(request: NextRequest) {
	const token = request.cookies.get(ADMIN_COOKIE_NAME);
	return Boolean(token?.value);
}

function redirectTo(request: NextRequest, path: string) {
	const url = request.nextUrl.clone();
	const nextPath = path.startsWith("/") ? path : `/${path}`;
	url.pathname = `${ADMIN_BASE_PATH}${nextPath}`;
	url.search = "";
	return NextResponse.redirect(url);
}

export async function middleware(request: NextRequest) {
	const pathname = stripBasePath(request.nextUrl.pathname);

	if (pathname === "/setup") {
		if (checkToken(request)) {
			return redirectTo(request, "/");
		}

		const init = await checkSetup();
		if (init) {
			return redirectTo(request, "/login");
		}

		return NextResponse.next();
	}

	if (pathname === "/login") {
		if (checkToken(request)) {
			return redirectTo(request, "/");
		}

		const init = await checkSetup();
		if (init) {
			return NextResponse.next();
		}

		return redirectTo(request, "/setup");
	}

	if (checkToken(request)) {
		return NextResponse.next();
	}

	const init = await checkSetup();
	if (init) {
		return redirectTo(request, "/login");
	}

	return redirectTo(request, "/setup");
}

export const config = {
	matcher: ["/((?!api|trpc|_next|_vercel|.*\\..*).*)"],
};
