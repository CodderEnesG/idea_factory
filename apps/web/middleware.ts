import { NextResponse, type NextRequest } from "next/server";

// Dahili araç ama Vercel URL'i public — WEB_BASIC_AUTH="kullanici:parola" set edilirse
// tüm sayfalar + API basic auth ister. Env yoksa açık kalır (lokal dev, demo modu).
const CRED = process.env["WEB_BASIC_AUTH"];

export function middleware(req: NextRequest) {
  if (!CRED) return NextResponse.next();

  const header = req.headers.get("authorization");
  if (header?.startsWith("Basic ")) {
    // Edge runtime: Buffer yok, atob var.
    const given = atob(header.slice(6));
    if (given === CRED) return NextResponse.next();
  }
  return new NextResponse("Kimlik doğrulama gerekli", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="idea-factory"' },
  });
}

export const config = {
  // statik varlıklar hariç her şey (sayfalar + /api/*)
  matcher: ["/((?!_next/static|_next/image|icon.svg|favicon.ico).*)"],
};
