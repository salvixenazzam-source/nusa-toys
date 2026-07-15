"use client";

import { useState, useMemo } from "react";
import { useStore } from "@/lib/ProductContext";
import { fmtDate } from "@/lib/helpers";

/* ── Komponen Utama ──────────────────────────────────────── */
export default function InventoryPage() {
  const { products, purchases, sales } = useStore();
  const [filterSku, setFilterSku] = useState("");

  /* ─── Ringkasan stok ────────────────── */
  const stockSummary = useMemo(
    () =>
      products
        .filter((p) => p.status === "Aktif")
        .map((p) => ({
          sku: p.sku,
          nama: p.nama,
          stok: p.stok,
          minStok: p.minStok,
          aman: p.stok >= p.minStok,
        })),
    [products]
  );

  /* ─── Timeline gabungan ─────────────── */
  const timeline = useMemo(() => {
    const items = [];

    purchases.forEach((p) => {
      items.push({
        id: `beli-${p.id}`,
        tanggal: p.tanggal,
        sku: p.sku,
        namaProduk: p.namaProduk,
        masuk: p.qty,
        keluar: 0,
        keterangan: `Pembelian — ${p.supplier}`,
        type: "masuk",
      });
    });

    sales.forEach((s) => {
      items.push({
        id: `jual-${s.id}`,
        tanggal: s.tanggal,
        sku: s.sku,
        namaProduk: s.namaProduk,
        masuk: 0,
        keluar: s.qty,
        keterangan: `Penjualan — ${s.invoice} — ${s.channel}`,
        type: "keluar",
      });
    });

    return items.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
  }, [purchases, sales]);

  const filteredTimeline = useMemo(() => {
    if (!filterSku) return timeline;
    return timeline.filter((t) => t.sku === filterSku);
  }, [timeline, filterSku]);

  /* ─── Render ─────────────────────────── */
  return (
    <div className="px-4 py-6 md:px-10 md:py-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-stone-800">Inventory</h1>
        <p className="mt-1 text-sm text-stone-500">
          Pantau stok real-time dan riwayat pergerakan barang masuk-keluar.
        </p>
      </div>

      {/* Catatan */}
      <div className="mt-4 rounded-xl bg-accent-light px-4 py-3 text-xs text-accent-dark font-medium">
        ℹ️ Stok berubah otomatis dari transaksi Pembelian & Penjualan — tidak bisa diedit manual.
      </div>

      {/* ── Ringkasan Stok ────────────────────────────────── */}
      <section className="mt-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-400 mb-3">Stok Saat Ini</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {stockSummary.map((p) => (
            <div
              key={p.sku}
              className={`rounded-xl border p-3 ${
                p.aman ? "border-stone-100 bg-white" : "border-red-200 bg-red-50"
              }`}
            >
              <p className="text-xs font-medium text-stone-800 truncate">{p.nama}</p>
              <p className="text-[10px] text-stone-400 font-mono">{p.sku}</p>
              <div className="mt-2 flex items-baseline justify-between">
                <span className={`text-lg font-semibold ${p.aman ? "text-stone-700" : "text-red-600"}`}>
                  {p.stok}
                </span>
                <span className="text-[10px] text-stone-400">
                  min {p.minStok}
                </span>
              </div>
              <span
                className={`mt-1 inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                  p.aman ? "bg-emerald-50 text-emerald-600" : "bg-red-100 text-red-600"
                }`}
              >
                {p.aman ? "Aman" : "Menipis"}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Filter ─────────────────────────────────────────── */}
      <div className="mt-8 flex items-center gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-400">Riwayat Pergerakan</h2>
        <select
          value={filterSku}
          onChange={(e) => setFilterSku(e.target.value)}
          className="rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-xs text-stone-600 outline-none focus:ring-2 focus:ring-accent/30"
        >
          <option value="">Semua Produk</option>
          {stockSummary.map((p) => (
            <option key={p.sku} value={p.sku}>
              {p.sku} — {p.nama}
            </option>
          ))}
        </select>
        <span className="ml-auto text-xs text-stone-400">
          {filteredTimeline.length} transaksi
        </span>
      </div>

      {/* ── Tabel Timeline ─────────────────────────────────── */}
      <div className="mt-3 overflow-x-auto rounded-2xl border border-stone-200 bg-white">
        <table className="w-full min-w-[600px] text-sm">
          <thead>
            <tr className="border-b border-stone-100 bg-stone-50 text-left text-xs font-medium uppercase tracking-wider text-stone-500">
              <th className="px-4 py-3">Tanggal</th>
              <th className="px-4 py-3">Produk</th>
              <th className="px-4 py-3 text-center">Masuk</th>
              <th className="px-4 py-3 text-center">Keluar</th>
              <th className="px-4 py-3">Keterangan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-50">
            {filteredTimeline.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-16 text-center text-stone-400">
                  Belum ada riwayat pergerakan stok.
                </td>
              </tr>
            )}
            {filteredTimeline.map((t) => (
              <tr key={t.id} className="hover:bg-stone-50/60">
                <td className="px-4 py-3 text-xs text-stone-500">{fmtDate(t.tanggal)}</td>
                <td className="px-4 py-3">
                  <span className="font-medium text-stone-800">{t.namaProduk}</span>
                  <span className="ml-1.5 font-mono text-[10px] text-stone-400">{t.sku}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  {t.masuk > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                      +{t.masuk}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  {t.keluar > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
                      −{t.keluar}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-stone-500">{t.keterangan}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
