import { auth } from "@/app/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const requestId = req.headers.get("x-request-id") ?? crypto.randomUUID();

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-request-id", requestId);

  if (req.nextUrl.pathname.startsWith("/api/")) {
    console.log(
      JSON.stringify({
        level: "info",
        message: "api_request",
        requestId,
        method: req.method,
        path: req.nextUrl.pathname,
        ts: new Date().toISOString(),
      })
    );
  }

  const res = NextResponse.next({
    request: { headers: requestHeaders },
  });
  res.headers.set("x-request-id", requestId);
  return res;
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
