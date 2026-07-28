import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession, authEnabled } from "./lib/session";

// Per-user session gate. AUTH_SECRET yoksa açık (lokal dev/demo — mevcut "env yoksa açık" deseni).
// Public: login sayfası + login API. Diğer her şey (sayfalar + /api/*) geçerli oturum ister.
const PUBLIC = ["/login", "/api/auth/login"];

export async function middleware(req: NextRequest) {
  if (!authEnabled()) return NextResponse.next();

  const { pathname } = req.nextUrl;
  if (PUBLIC.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  const user = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  if (user) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ ok: false, error: "kimlik doğrulama gerekli" }, { status: 401 });
  }
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  // statik varlıklar hariç her şey (sayfalar + /api/*)
  matcher: ["/((?!_next/static|_next/image|icon.svg|favicon.ico).*)"],
};
