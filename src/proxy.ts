import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "./lib/auth"; // adjust path

export default async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const token = request.cookies.get("token")?.value ?? null;

  let isValidToken = false;

  if (token) {
    const payload = await verifyToken(token);
    isValidToken = Boolean(payload);
  }

  // ----------------------------
  // ROUTE RULES
  // ----------------------------

  // 1️⃣ LOGIN PAGE
  if (path === "/login") {
    // If user already logged in → redirect to dashboard
    if (isValidToken) {
      return NextResponse.redirect(new URL("/dashboard", request.nextUrl));
    }
    // else allow login page
    return NextResponse.next();
  }

  // 2️⃣ DASHBOARD PAGE (protected)
  if (path.startsWith("/dashboard")) {
    if (!isValidToken) {
      return NextResponse.redirect(new URL("/login", request.nextUrl));
    }
    // allow dashboard
    return NextResponse.next();
  }

  // 3️⃣ ROOT HOME "/"
  if (path === "/") {
    // / is fully open → always allow
    return NextResponse.next();
  }

  // For all other pages (optional)
  return NextResponse.next();
}
