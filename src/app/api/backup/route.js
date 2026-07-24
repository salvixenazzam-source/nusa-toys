import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/* ── POST /api/backup ────────────────────────────────────── */
export async function POST(request) {
  try {
    const body = await request.json();
    const { periode_start, periode_end } = body;

    if (!periode_start || !periode_end) {
      return Response.json(
        { error: "periode_start dan periode_end wajib diisi" },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    /* 1. Ambil data keuangan (cashflow) ───── */
    const { data: keuanganData, error: keuanganError } = await supabase
      .from("keuangan")
      .select("*")
      .gte("tanggal", periode_start)
      .lte("tanggal", periode_end)
      .order("tanggal", { ascending: false });

    if (keuanganError) {
      return Response.json(
        { error: "Gagal ambil data keuangan", detail: keuanganError.message },
        { status: 500 }
      );
    }

    /* 2. Ambil data penjualan (untuk P&L) ── */
    const { data: salesData, error: salesError } = await supabase
      .from("penjualan")
      .select("*")
      .gte("tanggal", periode_start)
      .lte("tanggal", periode_end)
      .order("tanggal", { ascending: false });

    if (salesError) {
      return Response.json(
        { error: "Gagal ambil data penjualan", detail: salesError.message },
        { status: 500 }
      );
    }

    /* 3. Hitung summary cashflow ──────────── */
    const cashflowSummary = {
      pemasukan: 0,
      pengeluaran: 0,
      laba: 0,
      total_transaksi: keuanganData.length,
    };

    keuanganData.forEach((t) => {
      if (t.tipe === "Pemasukan") cashflowSummary.pemasukan += t.jumlah;
      else cashflowSummary.pengeluaran += t.jumlah;
    });
    cashflowSummary.laba =
      cashflowSummary.pemasukan - cashflowSummary.pengeluaran;

    /* 4. Hitung P&L ──────────────────────── */
    const pendapatanPenjualan = salesData.reduce((s, x) => s + x.omzet, 0);
    const pendapatanLain = keuanganData
      .filter((k) => k.tipe === "Pemasukan" && k.kategori !== "Penjualan")
      .reduce((s, k) => s + k.jumlah, 0);
    const totalPendapatan = pendapatanPenjualan + pendapatanLain;

    const hpp = salesData.reduce((s, x) => s + (x.omzet - (x.laba || 0)), 0);
    const labaKotor = salesData.reduce((s, x) => s + (x.laba || 0), 0);
    const margin =
      pendapatanPenjualan > 0
        ? parseFloat(((labaKotor / pendapatanPenjualan) * 100).toFixed(1))
        : 0;

    const biayaOpsDetail = {};
    keuanganData
      .filter(
        (k) =>
          k.tipe === "Pengeluaran" &&
          k.kategori !== "Pembelian Stok" &&
          k.kategori !== "Penjualan"
      )
      .forEach((k) => {
        const cat = k.kategori || "Lainnya";
        biayaOpsDetail[cat] = (biayaOpsDetail[cat] || 0) + k.jumlah;
      });
    const totalBiayaOps = Object.values(biayaOpsDetail).reduce(
      (s, v) => s + v,
      0
    );
    const labaBersih = labaKotor + pendapatanLain - totalBiayaOps;

    const totalTransaksi = salesData.length;
    const totalProdukTerjual = salesData.reduce((s, x) => s + x.qty, 0);

    // Channel breakdown
    const channelMap = {};
    salesData.forEach((s) => {
      if (!channelMap[s.channel])
        channelMap[s.channel] = { omzet: 0, laba: 0, qty: 0 };
      channelMap[s.channel].omzet += s.omzet;
      channelMap[s.channel].laba += s.laba || 0;
      channelMap[s.channel].qty += s.qty;
    });
    const channelBreakdown = Object.entries(channelMap)
      .map(([channel, v]) => ({ channel, ...v }))
      .sort((a, b) => b.omzet - a.omzet);

    /* 5. Insert ke Supabase backup tables ─ */
    const { error: cashflowInsertError } = await supabase
      .from("cashflow_backup")
      .insert({
        periode_start,
        periode_end,
        data: keuanganData,
        summary: cashflowSummary,
        created_by: "manual",
      });

    if (cashflowInsertError) {
      return Response.json(
        {
          error: "Gagal simpan backup cashflow",
          detail: cashflowInsertError.message,
        },
        { status: 500 }
      );
    }

    const { error: pnlInsertError } = await supabase
      .from("pnl_backup")
      .insert({
        periode_start,
        periode_end,
        pendapatan_penjualan: pendapatanPenjualan,
        pendapatan_lain: pendapatanLain,
        total_pendapatan: totalPendapatan,
        hpp,
        laba_kotor: labaKotor,
        margin,
        total_biaya_ops: totalBiayaOps,
        laba_bersih: labaBersih,
        biaya_ops_detail: biayaOpsDetail,
        channel_breakdown: channelBreakdown,
        total_transaksi: totalTransaksi,
        total_produk_terjual: totalProdukTerjual,
        created_by: "manual",
      });

    if (pnlInsertError) {
      return Response.json(
        { error: "Gagal simpan backup P&L", detail: pnlInsertError.message },
        { status: 500 }
      );
    }

    /* 6. Google Sheets backup (jika credential tersedia) ─ */
    const sheetsResult = await backupToGoogleSheets(
      periode_start,
      periode_end,
      {
        keuanganData,
        cashflowSummary,
        salesData,
        pendapatanPenjualan,
        hpp,
        labaKotor,
        margin,
        biayaOpsDetail,
        totalBiayaOps,
        labaBersih,
        channelBreakdown,
      }
    );

    return Response.json({
      success: true,
      message: "Backup berhasil",
      cashflow: {
        rows: keuanganData.length,
        pemasukan: cashflowSummary.pemasukan,
        pengeluaran: cashflowSummary.pengeluaran,
        laba: cashflowSummary.laba,
      },
      pnl: {
        pendapatan_penjualan: pendapatanPenjualan,
        hpp,
        laba_kotor: labaKotor,
        margin,
        laba_bersih: labaBersih,
        transaksi: totalTransaksi,
      },
      sheets: sheetsResult,
    });
  } catch (err) {
    return Response.json(
      { error: "Internal server error", detail: err.message },
      { status: 500 }
    );
  }
}

/* ── Google Sheets Integration ───────────────────────────── */
async function backupToGoogleSheets(periodeStart, periodeEnd, data) {
  const credsEnv = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  const sheetId = "15IzMLPKwCyf7VfjYkx11jLoJ-z2sBgM-7jB9eRYQ18w";

  if (!credsEnv) {
    return {
      status: "skipped",
      message: "GOOGLE_SERVICE_ACCOUNT_JSON belum dikonfigurasi",
    };
  }

  try {
    const credentials = JSON.parse(
      Buffer.from(credsEnv, "base64").toString("utf-8")
    );

    // Dapatkan access token via JWT
    const token = await getGoogleAccessToken(credentials);

    // Format periode label
    const label = `${periodeStart} s/d ${periodeEnd}`;
    const now = new Date().toISOString();

    // === Sheet 1: Cashflow ===
    const cashflowRows = [
      [
        "NUSA TOYS - BACKUP CASHFLOW",
        "",
        "",
        "",
        "",
      ],
      ["Periode", label, "", "", ""],
      ["Backup", now, "", "", ""],
      ["", "", "", "", ""],
      ["TANGGAL", "TIPE", "KATEGORI", "JUMLAH", "KETERANGAN"],
      ...data.keuanganData.map((k) => [
        k.tanggal,
        k.tipe,
        k.kategori,
        k.jumlah,
        k.keterangan || "",
      ]),
      ["", "", "", "", ""],
      [
        "TOTAL PEMASUKAN",
        "",
        "",
        data.cashflowSummary.pemasukan,
        "",
      ],
      [
        "TOTAL PENGELUARAN",
        "",
        "",
        data.cashflowSummary.pengeluaran,
        "",
      ],
      [
        "LABA",
        "",
        "",
        data.cashflowSummary.laba,
        "",
      ],
    ];

    await writeToSheet(token, sheetId, "Cashflow", "A1", cashflowRows);

    // === Sheet 2: P&L ===
    const pnlRows = [
      ["NUSA TOYS - BACKUP LABA RUGI", "", ""],
      ["Periode", label, ""],
      ["Backup", now, ""],
      ["", "", ""],
      ["KOMPONEN", "JUMLAH", "CATATAN"],
      ["Pendapatan Penjualan", data.pendapatanPenjualan, ""],
      ["HPP", data.hpp, ""],
      ["Laba Kotor", data.labaKotor, `Margin ${data.margin}%`],
      ...Object.entries(data.biayaOpsDetail).map(([cat, jml]) => [
        `Biaya ${cat}`,
        jml,
        "",
      ]),
      ["Total Biaya Operasional", data.totalBiayaOps, ""],
      ["Laba Bersih", data.labaBersih, ""],
    ];

    await writeToSheet(token, sheetId, "P&L", "A1", pnlRows);

    return { status: "success", sheets: ["Cashflow", "P&L"] };
  } catch (err) {
    return { status: "error", message: err.message };
  }
}

/* ── Google Auth Helpers ──────────────────────────────────── */
async function getGoogleAccessToken(credentials) {
  const header = { alg: "RS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: credentials.client_email,
    scope: "https://www.googleapis.com/auth/spreadsheets",
    aud: credentials.token_uri || "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  // Gunakan Web Crypto API untuk sign JWT
  const privateKey = credentials.private_key;
  const encoder = new TextEncoder();

  const base64url = (str) =>
    btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  const jwsHeader = base64url(JSON.stringify(header));
  const jwsPayload = base64url(JSON.stringify(claim));
  const signingInput = `${jwsHeader}.${jwsPayload}`;

  // Sign dengan private key
  const keyData = pemToArrayBuffer(privateKey);
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    keyData,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    encoder.encode(signingInput)
  );
  const jwsSignature = base64url(
    String.fromCharCode(...new Uint8Array(signature))
  );

  const assertion = `${signingInput}.${jwsSignature}`;

  // Tukar JWT dengan access token
  const res = await fetch(credentials.token_uri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google OAuth gagal: ${err}`);
  }

  const json = await res.json();
  return json.access_token;
}

function pemToArrayBuffer(pem) {
  const b64 = pem
    .replace(/-----.*?-----/g, "")
    .replace(/\s/g, "");
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

async function writeToSheet(token, sheetId, sheetName, range, rows) {
  // 1. Clear dulu seluruh isi sheet biar gak numpuk sisa lama
  const clearRange = `${sheetName}!A1:Z1000`;
  const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(clearRange)}:clear`;
  await fetch(clearUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  // 2. Tulis data baru
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(sheetName)}!${range}?valueInputOption=USER_ENTERED`;
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ values: rows }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google Sheets API gagal untuk ${sheetName}: ${err}`);
  }

  return res.json();
}
