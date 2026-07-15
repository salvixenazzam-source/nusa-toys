import { NextResponse } from "next/server";

// Fase A: Middleware dinonaktifkan — semua halaman bisa diakses tanpa login
export default async function proxy(request) {
  return NextResponse.next({ request });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|logo.png).*)",
  ],
};
