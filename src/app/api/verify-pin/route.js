import { NextResponse } from "next/server";

/**
 * POST /api/verify-pin
 * Body: { pin: string }
 * Verifikasi PIN edit transaksi terhadap env var EDIT_PIN (server-side only).
 * Response: { ok: true | false }
 */
export async function POST(request) {
  try {
    const { pin } = await request.json();

    if (!pin || typeof pin !== "string") {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const validPin = process.env.EDIT_PIN;
    if (!validPin) {
      console.error("EDIT_PIN env var tidak diset di server");
      return NextResponse.json({ ok: false }, { status: 500 });
    }

    const ok = pin === validPin;
    return NextResponse.json({ ok });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
