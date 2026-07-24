"use client";

import { useState, useMemo } from "react";
import { useStore } from "@/lib/ProductContext";
import { fmtDate } from "@/lib/helpers";

/* ── Helpers ─────────────────────────────────────────────── */
const fmtRupiah = (n) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);

const today = () => new Date().toISOString().slice(0, 10);

function startOfMonth(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}
function startOfYear(d) {
  return `${d.getFullYear()}-01-01`;
}
function daysAgo(d, n) {
  const t = new Date(d);
  t.setDate(t.getDate() - n);
  return t.toISOString().slice(0, 10);
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

/* ── Komponen Utama ──────────────────────────────────────── */
export default function LaporanPage() {
  const { sales, keuangan, products, purchases } = useStore();

  /* ─── Periode ───────────────────────── */
  const [periode, setPeriode] = useState("bulan-ini");
  const [dateFrom, setDateFrom] = useState(startOfMonth(new Date()));
  const [dateTo, setDateTo] = useState(today());

  const setQuick = (key) => {
    const now = new Date();
    setPeriode(key);
    switch (key) {
      case "hari-ini":
        setDateFrom(today());
        setDateTo(today());
        break;
      case "kemarin":
        setDateFrom(daysAgo(now, 1));
        setDateTo(daysAgo(now, 1));
        break;
      case "7-hari":
        setDateFrom(daysAgo(now, 6));
        setDateTo(today());
        break;
      case "30-hari":
        setDateFrom(daysAgo(now, 29));
        setDateTo(today());
        break;
      case "bulan-ini":
        setDateFrom(startOfMonth(now));
        setDateTo(today());
        break;
      case "bulan-lalu": {
        const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const last = new Date(now.getFullYear(), now.getMonth(), 0);
        setDateFrom(first.toISOString().slice(0, 10));
        setDateTo(last.toISOString().slice(0, 10));
        break;
      }
      case "tahun-ini":
        setDateFrom(startOfYear(now));
        setDateTo(today());
        break;
      default:
        break;
    }
  };

  /* ─── Filter data ────────────────────── */
  const filteredSales = useMemo(
    () =>
      sales.filter(
        (s) => s.tanggal >= dateFrom && s.tanggal <= dateTo
      ),
    [sales, dateFrom, dateTo]
  );

  const filteredKeuangan = useMemo(
    () =>
      keuangan.filter(
        (k) => k.tanggal >= dateFrom && k.tanggal <= dateTo
      ),
    [keuangan, dateFrom, dateTo]
  );

  /* ─── Kalkulasi P&L ──────────────────── */
  const pnl = useMemo(() => {
    // Pendapatan dari penjualan
    const pendapatanPenjualan = filteredSales.reduce(
      (s, x) => s + x.omzet,
      0
    );

    // Pendapatan lain dari keuangan (Pemasukan non-Penjualan)
    const pendapatanLain = filteredKeuangan
      .filter((k) => k.tipe === "Pemasukan" && k.kategori !== "Penjualan")
      .reduce((s, k) => s + k.jumlah, 0);

    const totalPendapatan = pendapatanPenjualan + pendapatanLain;

    // HPP = omzet - laba (dari data penjualan)
    const hpp = filteredSales.reduce((s, x) => s + (x.omzet - (x.laba || 0)), 0);

    // Laba Kotor = Pendapatan Penjualan - HPP  (atau: sum of laba)
    const labaKotor = filteredSales.reduce((s, x) => s + (x.laba || 0), 0);

    // Biaya Operasional dari keuangan (Pengeluaran non-Pembelian Stok)
    const biayaOpsDetail = {};
    const biayaOpsRows = filteredKeuangan.filter(
      (k) =>
        k.tipe === "Pengeluaran" &&
        k.kategori !== "Pembelian Stok" &&
        k.kategori !== "Penjualan"
    );
    biayaOpsRows.forEach((k) => {
      const cat = k.kategori || "Lainnya";
      biayaOpsDetail[cat] = (biayaOpsDetail[cat] || 0) + k.jumlah;
    });
    const totalBiayaOps = Object.values(biayaOpsDetail).reduce(
      (s, v) => s + v,
      0
    );

    // Laba Bersih
    const labaBersih = labaKotor + pendapatanLain - totalBiayaOps;

    // Margin
    const margin =
      pendapatanPenjualan > 0
        ? ((labaKotor / pendapatanPenjualan) * 100).toFixed(1)
        : "0.0";

    return {
      pendapatanPenjualan,
      pendapatanLain,
      totalPendapatan,
      hpp,
      labaKotor,
      margin,
      biayaOpsDetail,
      totalBiayaOps,
      labaBersih,
      totalTransaksi: filteredSales.length,
      totalProdukTerjual: filteredSales.reduce((s, x) => s + x.qty, 0),
    };
  }, [filteredSales, filteredKeuangan]);

  /* ─── Channel breakdown ─────────────── */
  const channelBreakdown = useMemo(() => {
    const map = {};
    filteredSales.forEach((s) => {
      if (!map[s.channel]) map[s.channel] = { omzet: 0, laba: 0, qty: 0 };
      map[s.channel].omzet += s.omzet;
      map[s.channel].laba += s.laba || 0;
      map[s.channel].qty += s.qty;
    });
    return Object.entries(map)
      .map(([ch, v]) => ({ channel: ch, ...v }))
      .sort((a, b) => b.omzet - a.omzet);
  }, [filteredSales]);

  /* ─── Render ────────────────────────── */
  return (
    <div className="px-4 py-6 md:px-10 md:py-10">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-stone-800">
            Laporan Laba Rugi
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            Profit &amp; Loss — ringkasan performa bisnis.
          </p>
        </div>
      </div>

      {/* ── Filter Periode ─────────────────────────────────── */}
      <div className="mt-6 rounded-2xl border border-stone-200 bg-white p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wider text-stone-400 mr-1">
            Periode
          </span>
          {[
            { key: "hari-ini", label: "Hari Ini" },
            { key: "kemarin", label: "Kemarin" },
            { key: "7-hari", label: "7 Hari" },
            { key: "30-hari", label: "30 Hari" },
            { key: "bulan-ini", label: "Bulan Ini" },
            { key: "bulan-lalu", label: "Bulan Lalu" },
            { key: "tahun-ini", label: "Tahun Ini" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setQuick(key)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                periode === key
                  ? "bg-accent text-white"
                  : "bg-stone-100 text-stone-500 hover:bg-stone-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-stone-500">Dari</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPeriode("custom");
              }}
              className="rounded-lg border border-stone-200 px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-accent/30"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-stone-500">Sampai</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPeriode("custom");
              }}
              className="rounded-lg border border-stone-200 px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-accent/30"
            />
          </div>
          <span className="text-xs text-stone-400">
            {pnl.totalTransaksi} transaksi &middot; {pnl.totalProdukTerjual} unit terjual
          </span>
        </div>
      </div>

      {/* ── Ringkasan ───────────────────────────────────────── */}
      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-2xl bg-emerald-50 p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-emerald-600">
            Pendapatan
          </p>
          <p className="mt-1 text-xl font-semibold text-emerald-700">
            {fmtRupiah(pnl.pendapatanPenjualan)}
          </p>
        </div>
        <div className="rounded-2xl bg-red-50 p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-red-500">
            HPP
          </p>
          <p className="mt-1 text-xl font-semibold text-red-600">
            {fmtRupiah(pnl.hpp)}
          </p>
        </div>
        <div className="rounded-2xl bg-blue-50 p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-blue-600">
            Laba Kotor
          </p>
          <p className="mt-1 text-xl font-semibold text-blue-700">
            {fmtRupiah(pnl.labaKotor)}
          </p>
          <p className="mt-0.5 text-xs text-blue-400">
            Margin {pnl.margin}%
          </p>
        </div>
        <div
          className={`rounded-2xl p-5 ${
            pnl.labaBersih >= 0 ? "bg-accent-light" : "bg-red-100"
          }`}
        >
          <p
            className={`text-xs font-medium uppercase tracking-wider ${
              pnl.labaBersih >= 0 ? "text-accent-dark" : "text-red-600"
            }`}
          >
            Laba Bersih
          </p>
          <p
            className={`mt-1 text-xl font-semibold ${
              pnl.labaBersih >= 0 ? "text-accent-dark" : "text-red-700"
            }`}
          >
            {fmtRupiah(pnl.labaBersih)}
          </p>
        </div>
      </div>

      {/* ── Detail P&L + Channel Breakdown ─────────────────── */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* P&L Detail */}
        <div className="rounded-2xl border border-stone-200 bg-white">
          <div className="border-b border-stone-100 px-6 py-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-400">
              Rincian Laba Rugi
            </h2>
          </div>
          <div className="px-6 py-4 space-y-2 text-sm">
            {/* Pendapatan */}
            <div className="flex justify-between">
              <span className="text-stone-600">Pendapatan Penjualan</span>
              <span className="font-mono font-medium text-emerald-600">
                {fmtRupiah(pnl.pendapatanPenjualan)}
              </span>
            </div>
            {pnl.pendapatanLain > 0 && (
              <div className="flex justify-between">
                <span className="text-stone-500 pl-4">Pendapatan Lain</span>
                <span className="font-mono text-emerald-500 text-xs">
                  + {fmtRupiah(pnl.pendapatanLain)}
                </span>
              </div>
            )}
            <div className="flex justify-between border-b border-stone-100 pb-2">
              <span className="font-medium text-stone-700">Total Pendapatan</span>
              <span className="font-mono font-semibold text-emerald-700">
                {fmtRupiah(pnl.totalPendapatan)}
              </span>
            </div>

            {/* HPP */}
            <div className="flex justify-between pt-1">
              <span className="text-stone-600">Harga Pokok Penjualan</span>
              <span className="font-mono font-medium text-red-500">
                ({fmtRupiah(pnl.hpp)})
              </span>
            </div>

            {/* Laba Kotor */}
            <div className="flex justify-between border-b border-stone-100 pb-2">
              <span className="font-medium text-stone-700">Laba Kotor</span>
              <span
                className={`font-mono font-semibold ${
                  pnl.labaKotor >= 0 ? "text-blue-700" : "text-red-600"
                }`}
              >
                {fmtRupiah(pnl.labaKotor)}
              </span>
            </div>

            {/* Biaya Operasional */}
            <div className="pt-1">
              <span className="text-xs font-medium text-stone-400 uppercase tracking-wider">
                Biaya Operasional
              </span>
            </div>
            {Object.keys(pnl.biayaOpsDetail).length === 0 && (
              <div className="flex justify-between pl-4">
                <span className="text-stone-400 text-xs">Tidak ada biaya</span>
                <span className="font-mono text-stone-400 text-xs">—</span>
              </div>
            )}
            {Object.entries(pnl.biayaOpsDetail)
              .sort(([, a], [, b]) => b - a)
              .map(([cat, jumlah]) => (
                <div key={cat} className="flex justify-between pl-4">
                  <span className="text-stone-500">{cat}</span>
                  <span className="font-mono text-red-500 text-xs">
                    ({fmtRupiah(jumlah)})
                  </span>
                </div>
              ))}
            <div className="flex justify-between border-b border-stone-100 pb-2">
              <span className="font-medium text-stone-600">Total Biaya Operasional</span>
              <span className="font-mono font-medium text-red-600">
                ({fmtRupiah(pnl.totalBiayaOps)})
              </span>
            </div>

            {/* Laba Bersih */}
            <div className="flex justify-between pt-2">
              <span className="text-base font-semibold text-stone-800">
                Laba Bersih
              </span>
              <span
                className={`text-base font-mono font-bold ${
                  pnl.labaBersih >= 0 ? "text-accent-dark" : "text-red-700"
                }`}
              >
                {fmtRupiah(pnl.labaBersih)}
              </span>
            </div>
          </div>
        </div>

        {/* Channel Breakdown */}
        <div className="rounded-2xl border border-stone-200 bg-white">
          <div className="border-b border-stone-100 px-6 py-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-400">
              Per Channel
            </h2>
          </div>
          <div className="px-6 py-4">
            {channelBreakdown.length === 0 ? (
              <p className="text-sm text-stone-400 py-8 text-center">
                Belum ada penjualan di periode ini.
              </p>
            ) : (
              <div className="space-y-3">
                {channelBreakdown.map((ch) => (
                  <div
                    key={ch.channel}
                    className="rounded-xl border border-stone-100 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-stone-700">
                        {ch.channel}
                      </span>
                      <span className="text-xs text-stone-400">
                        {ch.qty} unit
                      </span>
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <p className="text-stone-400">Omzet</p>
                        <p className="font-mono font-medium text-stone-700">
                          {fmtRupiah(ch.omzet)}
                        </p>
                      </div>
                      <div>
                        <p className="text-stone-400">Laba</p>
                        <p className="font-mono font-medium text-emerald-600">
                          {fmtRupiah(ch.laba)}
                        </p>
                      </div>
                      <div>
                        <p className="text-stone-400">Margin</p>
                        <p className="font-mono font-medium text-blue-600">
                          {ch.omzet > 0
                            ? ((ch.laba / ch.omzet) * 100).toFixed(0)
                            : 0}
                          %
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
