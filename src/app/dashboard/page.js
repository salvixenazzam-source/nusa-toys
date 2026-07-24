"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/ProductContext";
import {
  ResponsiveContainer, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";

/* ── Helpers ─────────────────────────────────────────────── */
const fmtRupiah = (n) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

/* ── Custom Tooltip ──────────────────────────────────────── */
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-stone-200 bg-white px-3 py-2 shadow-md text-xs">
      <p className="font-medium text-stone-600 mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color }}>
          {entry.name}: {entry.value} unit
        </p>
      ))}
    </div>
  );
}

/* ── Kartu kecil (dengan children opsional) ─────────────── */
function StatCard({ label, value, sub, accent = false, children }) {
  return (
    <div className={`rounded-2xl p-5 ${accent ? "bg-accent-light" : "bg-white border border-stone-100"}`}>
      <p className="text-xs font-medium uppercase tracking-wider text-stone-400">{label}</p>
      <p className={`mt-1.5 text-2xl font-semibold tracking-tight ${accent ? "text-accent-dark" : "text-stone-800"}`}>
        {value}
      </p>
      {sub && <p className="mt-0.5 text-xs text-stone-400">{sub}</p>}
      {children}
    </div>
  );
}

/* ── Bar chart Channel (tak berubah) ────────────────────── */
function ChannelBar({ channels }) {
  const max = Math.max(...channels.map((c) => c.omzet), 1);
  return (
    <div className="space-y-3">
      {channels.map((c) => (
        <div key={c.channel} className="flex items-center gap-3">
          <span className="w-16 text-xs font-medium text-stone-500">{c.channel}</span>
          <div className="flex-1 h-6 rounded-full bg-stone-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-accent transition-all duration-500"
              style={{ width: `${(c.omzet / max) * 100}%` }}
            />
          </div>
          <span className="w-28 text-right text-xs font-medium text-stone-700">{fmtRupiah(c.omzet)}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Nama bulan ──────────────────────────────────────────── */
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

/* ── Komponen Utama ──────────────────────────────────────── */
export default function DashboardPage() {
  const { products, sales, customers, keuangan, purchases, targetOmzet, diskonList } = useStore();
  const [chartMode, setChartMode] = useState("bulanan"); // "bulanan" | "harian"

  /* ─── Hitung metrik ──────────────────── */
  const totalOmzet = useMemo(() => sales.reduce((s, x) => s + x.omzet, 0), [sales]);
  const totalLaba = useMemo(() => sales.reduce((s, x) => s + x.laba, 0), [sales]);
  const totalTransaksi = sales.length;
  const omzetPercent = Math.round((totalOmzet / targetOmzet) * 100);

  /* Progress bar color */
  const progressColor = omzetPercent >= 100
    ? "bg-emerald-500"
    : omzetPercent >= 50
    ? "bg-amber-400"
    : "bg-red-500";

  /* Produk stok menipis */
  const lowStock = useMemo(
    () => products.filter((p) => p.stok < p.minStok && p.status === "Aktif"),
    [products]
  );

  /* Produk terlaris (by qty terjual) */
  const topProducts = useMemo(() => {
    const map = {};
    sales.forEach((s) => {
      map[s.sku] = (map[s.sku] || 0) + s.qty;
    });
    return Object.entries(map)
      .map(([sku, qty]) => {
        const p = products.find((pr) => pr.sku === sku);
        return { sku, nama: p?.nama || sku, qty };
      })
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  }, [sales, products]);

  /* Pelanggan */
  const repeatBuyers = useMemo(() => {
    const count = {};
    sales.forEach((s) => {
      const name = s.pembeli.toLowerCase();
      count[name] = (count[name] || 0) + 1;
    });
    return Object.values(count).filter((c) => c > 1).length;
  }, [sales]);

  /* Penjualan per channel */
  const channelSales = useMemo(() => {
    const map = {};
    sales.forEach((s) => {
      map[s.channel] = (map[s.channel] || 0) + s.omzet;
    });
    return Object.entries(map)
      .map(([channel, omzet]) => ({ channel, omzet }))
      .sort((a, b) => b.omzet - a.omzet);
  }, [sales]);

  /* Keuangan — gabungan manual + purchases (skip auto-generated) */
  const totalPengeluaran = useMemo(() => {
    const manual = keuangan.filter((k) => k.tipe === "Pengeluaran" && k.kategori !== "Pembelian Stok").reduce((s, k) => s + k.jumlah, 0);
    const beli = purchases.reduce((s, p) => s + p.total, 0);
    return manual + beli;
  }, [keuangan, purchases]);
  const pemasukanManual = useMemo(
    () => keuangan.filter((k) => k.tipe === "Pemasukan" && k.kategori !== "Penjualan").reduce((s, k) => s + k.jumlah, 0),
    [keuangan]
  );
  const totalPemasukan = totalOmzet + pemasukanManual;
  const labaBersih = totalPemasukan - totalPengeluaran;

  /* ─── Diskon ─────────────────────────── */
  const diskonAktif = useMemo(() => {
    const todayDate = new Date().toISOString().slice(0, 10);
    return diskonList.filter(
      (d) => d.aktif && d.mulai <= todayDate && (!d.selesai || d.selesai >= todayDate)
    ).length;
  }, [diskonList]);

  const totalHemat = useMemo(() => sales.reduce((s, x) => s + (x.hemat || 0), 0), [sales]);

  /* ─── Data tren Bulanan (6 bulan terakhir) ─────────────── */
  const monthlyData = useMemo(() => {
    // Agregasi unit terjual per bulan
    const aggr = {};
    sales.forEach((s) => {
      const monthKey = s.tanggal.substring(0, 7); // "2026-07"
      if (!aggr[monthKey]) aggr[monthKey] = 0;
      aggr[monthKey] += s.qty;
    });

    const now = new Date();
    const result = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = MONTHS[d.getMonth()];
      const actual = aggr[key];
      result.push({
        label,
        unit: actual || 0,
      });
    }
    return result;
  }, [sales]);

  /* ─── Data tren Harian (7 hari terakhir) ───────────────── */
  const dailyData = useMemo(() => {
    const aggr = {};
    sales.forEach((s) => {
      if (!aggr[s.tanggal]) aggr[s.tanggal] = 0;
      aggr[s.tanggal] += s.qty;
    });

    const today = new Date();
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().substring(0, 10);
      const label = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
      const actual = aggr[key];
      result.push({
        label,
        unit: actual || 0,
      });
    }
    return result;
  }, [sales]);

  /* ─── Render ─────────────────────────── */
  return (
    <div className="px-4 py-6 md:px-10 md:py-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-stone-800">Dashboard</h1>
        <p className="mt-1 text-sm text-stone-500">
          Ringkasan kondisi bisnis — penjualan, stok, pelanggan, dan keuangan.
        </p>
      </div>

      {/* ── Grafik Tren ────────────────────────────────── */}
      <section className="mt-6 rounded-2xl border border-stone-100 bg-white p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-400">
            📈 Tren Penjualan
          </h2>
          <div className="flex rounded-lg border border-stone-200 bg-stone-50 p-0.5 text-xs">
            <button
              onClick={() => setChartMode("bulanan")}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                chartMode === "bulanan"
                  ? "bg-white text-stone-800 shadow-sm"
                  : "text-stone-400 hover:text-stone-600"
              }`}
            >
              Bulanan
            </button>
            <button
              onClick={() => setChartMode("harian")}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                chartMode === "harian"
                  ? "bg-white text-stone-800 shadow-sm"
                  : "text-stone-400 hover:text-stone-600"
              }`}
            >
              Harian
            </button>
          </div>
        </div>

        <div className="h-72 w-full">
          {chartMode === "bulanan" ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} barCategoryGap="25%">
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#78716c" }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: "#a8a29e" }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="unit" name="Unit Terjual" fill="#0d9488" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData} barCategoryGap="25%">
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#78716c" }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: "#a8a29e" }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="unit" name="Unit Terjual" fill="#0d9488" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      {/* ── Ringkasan ──────────────────────────────────── */}
      <section className="mt-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-400 mb-3">Ringkasan</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {/* Total Omzet — dengan progress bar target */}
          <div className="rounded-2xl bg-accent-light p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-stone-400">Total Omzet</p>
            <p className="mt-1.5 text-2xl font-semibold tracking-tight text-accent-dark">
              {fmtRupiah(totalOmzet)}
            </p>
            <p className="mt-0.5 text-xs text-stone-400">{totalTransaksi} transaksi</p>
            {/* Progress bar target */}
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-stone-400">
                  {fmtRupiah(totalOmzet)} / target {fmtRupiah(targetOmzet)}
                </span>
                <span className="text-[10px] font-medium text-stone-500">{omzetPercent}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-stone-200 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
                  style={{ width: `${Math.min(omzetPercent, 100)}%` }}
                />
              </div>
            </div>
          </div>
          <StatCard label="Total Laba" value={fmtRupiah(totalLaba)} />
          <StatCard label="Transaksi" value={totalTransaksi} sub="penjualan" />
          <StatCard label="Pelanggan" value={customers.length} sub={`${repeatBuyers} repeat`} />
          <StatCard label="Diskon Aktif" value={diskonAktif} sub="berlaku hari ini" accent />
          <StatCard label="Total Hemat" value={fmtRupiah(totalHemat)} sub="dari diskon" />
        </div>
      </section>

      {/* ── Grid 2 kolom ─────────────────────────────────── */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* ── Gudang: Stok Menipis ──────────────────────── */}
        <section className="rounded-2xl border border-stone-100 bg-white p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-400 mb-3">
            ⚠️ Stok Menipis
          </h2>
          {lowStock.length === 0 ? (
            <p className="text-sm text-stone-400">Semua stok aman.</p>
          ) : (
            <div className="space-y-2">
              {lowStock.map((p) => (
                <div key={p.sku} className="flex items-center justify-between rounded-xl bg-red-50 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-stone-800">{p.nama}</p>
                    <p className="text-xs text-stone-400 font-mono">{p.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-red-600">{p.stok}</p>
                    <p className="text-[10px] text-red-400">min {p.minStok}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Produk Terlaris */}
          <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-400 mt-6 mb-3">
            🔥 Produk Terlaris
          </h2>
          {topProducts.length === 0 ? (
            <p className="text-sm text-stone-400">Belum ada penjualan.</p>
          ) : (
            <div className="space-y-1.5">
              {topProducts.map((tp, i) => (
                <div key={tp.sku} className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-stone-50">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-stone-300 w-4 text-right">{i + 1}</span>
                    <span className="text-sm text-stone-700">{tp.nama}</span>
                  </div>
                  <span className="text-xs font-medium text-stone-500">{tp.qty} terjual</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Kolom Kanan ────────────────────────────────── */}
        <div className="space-y-6">
          {/* Keuangan */}
          <section className="rounded-2xl border border-stone-100 bg-white p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-400 mb-3">
              💵 Keuangan
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-emerald-50 p-4">
                <p className="text-xs text-emerald-600 font-medium">Pemasukan</p>
                <p className="mt-1 text-lg font-semibold text-emerald-700">{fmtRupiah(totalPemasukan)}</p>
                <p className="text-[10px] text-emerald-400">penjualan + manual</p>
              </div>
              <div className="rounded-xl bg-red-50 p-4">
                <p className="text-xs text-red-500 font-medium">Pengeluaran</p>
                <p className="mt-1 text-lg font-semibold text-red-600">{fmtRupiah(totalPengeluaran)}</p>
              </div>
            </div>
            {/* ── Laba Bersih + Alert Arus Kas ──────────── */}
            <div className={`mt-3 rounded-xl p-4 ${labaBersih >= 0 ? "bg-accent-light" : "bg-red-100 border border-red-200"}`}>
              <p className={`text-xs font-medium ${labaBersih >= 0 ? "text-accent-dark" : "text-red-600"}`}>
                Laba Bersih
              </p>
              <p className={`mt-1 text-lg font-semibold ${labaBersih >= 0 ? "text-accent-dark" : "text-red-700"}`}>
                {fmtRupiah(labaBersih)}
              </p>
              {labaBersih < 0 && (
                <p className="mt-1.5 text-xs font-medium text-red-500">
                  ⚠️ Pengeluaran melebihi pemasukan
                </p>
              )}
            </div>
          </section>

          {/* Penjualan per Channel */}
          <section className="rounded-2xl border border-stone-100 bg-white p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-400 mb-4">
              📡 Penjualan per Channel
            </h2>
            {channelSales.length === 0 ? (
              <p className="text-sm text-stone-400">Belum ada penjualan.</p>
            ) : (
              <ChannelBar channels={channelSales} />
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
