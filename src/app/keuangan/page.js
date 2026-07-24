"use client";

import { useState, useMemo } from "react";
import { useStore } from "@/lib/ProductContext";
import { fmtDate } from "@/lib/helpers";

/* ── Helpers ─────────────────────────────────────────────── */
const fmtRupiah = (n) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

const today = () => new Date().toISOString().slice(0, 10);

const TIPE = ["Pemasukan", "Pengeluaran"];
const KATEGORI_PENGELUARAN = ["Operasional", "Gaji", "Pajak", "Beli Stok", "Lainnya"];
const FILTER_TABS = ["Semua", "Penjualan", "Pembelian", "Operasional"];

const EMPTY_FORM = {
  tanggal: today(),
  tipe: "Pengeluaran",
  kategori: "Operasional",
  jumlah: "",
  keterangan: "",
};

const SOURCE_COLORS = {
  Penjualan: "bg-blue-50 text-blue-700",
  Pembelian: "bg-purple-50 text-purple-700",
  Manual: "bg-stone-100 text-stone-500",
};

/* ── Komponen Utama ──────────────────────────────────────── */
export default function KeuanganPage() {
  const { sales, purchases, keuangan, addKeuangan } = useStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [filterTab, setFilterTab] = useState("Semua");

  /* ─── Gabung semua transaksi ────────── */
  const allTransactions = useMemo(() => {
    const items = [];

    // Penjualan → Pemasukan
    sales.forEach((s) => {
      items.push({
        id: `sale-${s.id}`,
        tanggal: s.tanggal,
        tipe: "Pemasukan",
        kategori: "Penjualan",
        jumlah: s.omzet,
        keterangan: `${s.invoice} — ${s.pembeli}`,
        sumber: "Penjualan",
      });
    });

    // Pembelian → Pengeluaran
    purchases.forEach((p) => {
      items.push({
        id: `beli-${p.id}`,
        tanggal: p.tanggal,
        tipe: "Pengeluaran",
        kategori: "Pembelian Stok",
        jumlah: p.total,
        keterangan: `${p.supplier} — ${p.namaProduk}`,
        sumber: "Pembelian",
      });
    });

    // Manual (skip auto-generated dari pembelian/penjualan)
    keuangan.forEach((k) => {
      if (k.kategori === "Penjualan" || k.kategori === "Pembelian Stok") return;
      items.push({ ...k, sumber: "Manual", id: `manual-${k.id}` });
    });

    return items.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
  }, [sales, purchases, keuangan]);

  /* ─── Filter ─────────────────────────── */
  const filtered = useMemo(() => {
    if (filterTab === "Semua") return allTransactions;
    if (filterTab === "Operasional") return allTransactions.filter((t) => t.sumber === "Manual");
    return allTransactions.filter((t) => t.sumber === filterTab);
  }, [allTransactions, filterTab]);

  /* ─── Ringkasan dari filtered ───────── */
  const summary = useMemo(() => {
    const pemasukan = filtered.filter((t) => t.tipe === "Pemasukan").reduce((s, t) => s + t.jumlah, 0);
    const pengeluaran = filtered.filter((t) => t.tipe === "Pengeluaran").reduce((s, t) => s + t.jumlah, 0);
    return { pemasukan, pengeluaran, laba: pemasukan - pengeluaran };
  }, [filtered]);

  /* ─── Buka modal ────────────────────── */
  const openAdd = () => {
    setForm({ ...EMPTY_FORM, tanggal: today() });
    setErrors({});
    setModalOpen(true);
  };

  /* ─── Validasi ──────────────────────── */
  const validate = () => {
    const e = {};
    if (!form.jumlah || Number(form.jumlah) <= 0) e.jumlah = "Jumlah harus > 0";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ─── Simpan ────────────────────────── */
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    const ok = await addKeuangan({
      tanggal: form.tanggal,
      tipe: form.tipe,
      kategori: form.kategori,
      jumlah: Number(form.jumlah),
      keterangan: form.keterangan.trim().replace(/<[^>]*>/g, ""),
    });
    setSaving(false);
    if (ok) setModalOpen(false);
  };

  /* ─── Render ────────────────────────── */
  return (
    <div className="px-4 py-6 md:px-10 md:py-10">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-stone-800">Keuangan</h1>
          <p className="mt-1 text-sm text-stone-500">
            Seluruh transaksi bisnis — penjualan, pembelian, dan operasional.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-dark self-start sm:self-auto"
        >
          <span className="text-base">+</span> Catat Transaksi
        </button>
      </div>

      {/* ── Ringkasan ─────────────────────────────────────── */}
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-emerald-50 p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-emerald-600">Pemasukan</p>
          <p className="mt-1 text-xl font-semibold text-emerald-700">{fmtRupiah(summary.pemasukan)}</p>
        </div>
        <div className="rounded-2xl bg-red-50 p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-red-500">Pengeluaran</p>
          <p className="mt-1 text-xl font-semibold text-red-600">{fmtRupiah(summary.pengeluaran)}</p>
        </div>
        <div className={`rounded-2xl p-5 ${summary.laba >= 0 ? "bg-accent-light" : "bg-red-50"}`}>
          <p className="text-xs font-medium uppercase tracking-wider text-accent-dark">Laba Bersih</p>
          <p className="mt-1 text-xl font-semibold text-accent-dark">{fmtRupiah(summary.laba)}</p>
        </div>
      </div>

      {/* ── Filter Tabs ───────────────────────────────────── */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setFilterTab(tab)}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
              filterTab === tab
                ? "bg-accent text-white"
                : "bg-stone-100 text-stone-500 hover:bg-stone-200"
            }`}
          >
            {tab}
          </button>
        ))}
        <span className="ml-auto text-xs text-stone-400">
          {filtered.length} transaksi
        </span>
      </div>

      {/* ── Tabel ─────────────────────────────────────────── */}
      <div className="mt-3 overflow-x-auto rounded-2xl border border-stone-200 bg-white">
        <table className="w-full min-w-[700px] text-sm">
          <thead>
            <tr className="border-b border-stone-100 bg-stone-50 text-left text-xs font-medium uppercase tracking-wider text-stone-500">
              <th className="px-4 py-3">Tanggal</th>
              <th className="px-4 py-3">Tipe</th>
              <th className="px-4 py-3">Kategori</th>
              <th className="px-4 py-3 text-right">Jumlah</th>
              <th className="px-4 py-3">Keterangan</th>
              <th className="px-4 py-3 text-center">Sumber</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-50">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-16 text-center text-stone-400">
                  Belum ada transaksi.
                </td>
              </tr>
            )}
            {filtered.map((t) => (
              <tr key={t.id} className="hover:bg-stone-50/60">
                <td className="px-4 py-3 text-stone-500 text-xs whitespace-nowrap">
                  {fmtDate(t.tanggal)}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                    t.tipe === "Pemasukan" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
                  }`}>
                    {t.tipe}
                  </span>
                </td>
                <td className="px-4 py-3 text-stone-600 text-xs">{t.kategori}</td>
                <td className={`px-4 py-3 text-right font-mono font-medium whitespace-nowrap ${
                  t.tipe === "Pemasukan" ? "text-emerald-600" : "text-red-600"
                }`}>
                  {t.tipe === "Pemasukan" ? "+" : "−"} {fmtRupiah(t.jumlah)}
                </td>
                <td className="px-4 py-3 text-stone-500 text-xs max-w-[220px] truncate">
                  {t.keterangan || "—"}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${SOURCE_COLORS[t.sumber] || "bg-stone-100 text-stone-500"}`}>
                    {t.sumber}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Modal Form ────────────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto pt-10 pb-10">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-stone-800">Catat Transaksi</h2>

            <div className="mt-5 space-y-4">
              {/* Tipe */}
              <div>
                <label className="block text-xs font-medium text-stone-500 mb-1">Tipe</label>
                <div className="flex gap-2">
                  {TIPE.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setForm({ ...form, tipe: t, kategori: t === "Pemasukan" ? "" : "Operasional" })}
                      className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                        form.tipe === t
                          ? t === "Pemasukan" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
                          : "bg-stone-100 text-stone-500 hover:bg-stone-200"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Kategori (hanya untuk pengeluaran) */}
              {form.tipe === "Pengeluaran" && (
                <div>
                  <label className="block text-xs font-medium text-stone-500 mb-1">Kategori</label>
                  <div className="flex flex-wrap gap-1.5">
                    {KATEGORI_PENGELUARAN.map((k) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setForm({ ...form, kategori: k })}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                          form.kategori === k
                            ? "bg-accent text-white"
                            : "bg-stone-100 text-stone-500 hover:bg-stone-200"
                        }`}
                      >
                        {k}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Tanggal */}
              <div>
                <label className="block text-xs font-medium text-stone-500 mb-1">Tanggal</label>
                <input
                  type="date"
                  value={form.tanggal}
                  onChange={(e) => setForm({ ...form, tanggal: e.target.value })}
                  className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/30"
                />
              </div>

              {/* Jumlah */}
              <div>
                <label className="block text-xs font-medium text-stone-500 mb-1">Jumlah *</label>
                <input
                  type="number"
                  min="0"
                  value={form.jumlah}
                  onChange={(e) => setForm({ ...form, jumlah: e.target.value })}
                  placeholder="0"
                  className={`w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/30 ${
                    errors.jumlah ? "border-red-300 bg-red-50" : "border-stone-200"
                  }`}
                />
                {errors.jumlah && <p className="mt-1 text-xs text-red-500">{errors.jumlah}</p>}
              </div>

              {/* Keterangan */}
              <div>
                <label className="block text-xs font-medium text-stone-500 mb-1">Keterangan</label>
                <input
                  type="text"
                  value={form.keterangan}
                  onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
                  placeholder="cth. Sewa tempat"
                  className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/30"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-xl px-4 py-2.5 text-sm font-medium text-stone-500 transition-colors hover:bg-stone-100"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-dark disabled:opacity-60"
              >
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
