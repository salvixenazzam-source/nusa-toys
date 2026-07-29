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

/* ── Form kosong ─────────────────────────────────────────── */
const EMPTY_FORM = {
  sku: "",
  tanggal: today(),
  supplier: "",
  qty: "",
  hargaSatuan: "",
  ongkir: "",
};

/* ── Komponen Utama ──────────────────────────────────────── */
export default function PembelianPage() {
  const { products, updateStock, purchases, purchasesLoading, addPurchase } = useStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  /* Filter & Sort */
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortAsc, setSortAsc] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterMode, setFilterMode] = useState("tanggal");

  const activeFilterCount = (startDate ? 1 : 0) + (productSearch ? 1 : 0);
  const hasFilter = activeFilterCount > 0;

  const clearFilters = () => {
    setStartDate("");
    setEndDate("");
    setProductSearch("");
  };

  const filteredPurchases = useMemo(() => {
    let result = purchases;
    if (startDate) result = result.filter((p) => p.tanggal >= startDate);
    if (endDate) result = result.filter((p) => p.tanggal <= endDate);
    if (productSearch) {
      const q = productSearch.toLowerCase();
      result = result.filter(
        (p) => p.namaProduk.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
      );
    }
    result = [...result].sort((a, b) => {
      const cmp = new Date(b.tanggal) - new Date(a.tanggal);
      return sortAsc ? -cmp : cmp;
    });
    return result;
  }, [purchases, startDate, endDate, sortAsc, productSearch]);

  const filterSummary = useMemo(() => ({
    total: filteredPurchases.length,
    qty: filteredPurchases.reduce((s, x) => s + x.qty, 0),
    nilai: filteredPurchases.reduce((s, x) => s + x.total, 0),
  }), [filteredPurchases]);

  const total = (Number(form.qty) || 0) * (Number(form.hargaSatuan) || 0) + (Number(form.ongkir) || 0);

  /* ─── Pilih produk → auto isi supplier & harga ─── */
  const handleSelectProduct = (sku) => {
    const p = products.find((pr) => pr.sku === sku);
    if (p) {
      setForm({
        ...form,
        sku,
        supplier: p.supplier,
        hargaSatuan: p.hargaModal.toString(),
      });
    } else {
      setForm({ ...form, sku });
    }
  };

  /* ─── Buka modal ───────────────────────── */
  const openAdd = () => {
    setForm({ ...EMPTY_FORM, tanggal: today() });
    setErrors({});
    setModalOpen(true);
  };

  /* ─── Validasi ─────────────────────────── */
  const validate = () => {
    const e = {};
    if (!form.sku) e.sku = "Produk wajib dipilih";
    if (!form.qty || Number(form.qty) <= 0) e.qty = "Qty harus > 0";
    if (!form.hargaSatuan || Number(form.hargaSatuan) <= 0) e.hargaSatuan = "Harga harus > 0";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ─── Simpan ───────────────────────────── */
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!validate()) return;

    setSaving(true);

    const qty = Number(form.qty);
    const hargaSatuan = Number(form.hargaSatuan);
    const ongkir = Number(form.ongkir) || 0;
    const selected = products.find((p) => p.sku === form.sku);

    const newPurchase = {
      tanggal: form.tanggal || today(),
      supplier: form.supplier,
      sku: form.sku,
      namaProduk: selected?.nama || "",
      qty,
      hargaSatuan,
      ongkir,
      total: qty * hargaSatuan + ongkir,
    };

    const ok = await addPurchase(newPurchase);
    if (!ok) {
      setSaving(false);
      return;
    }

    // ⚡ INTI: stok produk bertambah di Supabase
    await updateStock(form.sku, qty);

    setSaving(false);
    setModalOpen(false);
  };

  /* ─── Render ───────────────────────────── */
  return (
    <div className="px-4 py-6 md:px-10 md:py-10">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-stone-800">Pembelian</h1>
          <p className="mt-1 text-sm text-stone-500">
            Catat barang masuk dari supplier — stok otomatis bertambah.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-dark self-start sm:self-auto"
        >
          <span className="text-base">+</span> Catat Pembelian
        </button>
      </div>

      {/* Filter Toggle + Badge */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setFilterOpen(!filterOpen)}
          className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
            filterOpen || hasFilter ? "bg-accent text-white" : "bg-stone-100 text-stone-500 hover:bg-stone-200"
          }`}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/>
          </svg>
          Filter{hasFilter ? ` (${activeFilterCount})` : ""}
        </button>
        {hasFilter && (
          <button onClick={clearFilters} className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 transition-colors">
            ✕ Hapus filter
          </button>
        )}
        <div className="ml-auto flex items-center gap-3 text-xs text-stone-400">
          <span><span className="font-medium text-stone-600">{filterSummary.total}</span> transaksi</span>
          <span>Qty <span className="font-medium text-stone-600">{filterSummary.qty}</span></span>
          <span>Nilai <span className="font-medium text-stone-600">{fmtRupiah(filterSummary.nilai)}</span></span>
        </div>
      </div>

      {/* Filter Panel */}
      {filterOpen && (
        <div className="mt-2 rounded-2xl border border-stone-200 bg-white p-4">
          <div className="flex gap-1 mb-3">
            {[
              ["tanggal", "Tanggal"],
              ["produk", "Nama Produk/SKU"],
            ].map(([val, label]) => (
              <button key={val} onClick={() => setFilterMode(val)} className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                filterMode === val ? "bg-accent text-white" : "bg-stone-100 text-stone-500 hover:bg-stone-200"
              }`}>{label}</button>
            ))}
          </div>
          {filterMode === "tanggal" && (
            <div className="flex flex-wrap items-end gap-2">
              <div className="flex items-center gap-1.5">
                <label className="text-[11px] font-medium text-stone-400">Dari</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="rounded-lg border border-stone-200 px-2 py-1.5 text-xs text-stone-600 outline-none focus:ring-2 focus:ring-accent/30" />
              </div>
              <div className="flex items-center gap-1.5">
                <label className="text-[11px] font-medium text-stone-400">Sampai</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="rounded-lg border border-stone-200 px-2 py-1.5 text-xs text-stone-600 outline-none focus:ring-2 focus:ring-accent/30" />
              </div>
              <div className="flex gap-1">
                {[
                  ["Hari ini", () => { const t=new Date().toISOString().slice(0,10); setStartDate(t); setEndDate(t); }],
                  ["7 hari", () => { const d=new Date();d.setDate(d.getDate()-6); setStartDate(d.toISOString().slice(0,10)); setEndDate(new Date().toISOString().slice(0,10)); }],
                  ["Bulan ini", () => { const d=new Date();d.setDate(1); setStartDate(d.toISOString().slice(0,10)); setEndDate(new Date().toISOString().slice(0,10)); }],
                  ["Semua", () => { setStartDate(""); setEndDate(""); }],
                ].map(([label, fn]) => (
                  <button key={label} onClick={fn} className="rounded-lg px-2.5 py-1.5 text-[11px] font-medium bg-stone-100 text-stone-500 hover:bg-stone-200 transition-colors">{label}</button>
                ))}
              </div>
            </div>
          )}
          {filterMode === "produk" && (
            <div className="relative max-w-xs">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"/></svg>
              <input type="text" value={productSearch} onChange={(e) => setProductSearch(e.target.value)} placeholder="Cari nama produk atau SKU..." className="w-full rounded-lg border border-stone-200 bg-white py-2 pl-8 pr-3 text-sm outline-none focus:ring-2 focus:ring-accent/30" />
            </div>
          )}
        </div>
      )}

      {/* Tabel */}
      <div className="mt-6 overflow-x-auto rounded-2xl border border-stone-200 bg-white">
        <table className="w-full min-w-[700px] text-sm">
          <thead>
            <tr className="border-b border-stone-100 bg-stone-50 text-left text-xs font-medium uppercase tracking-wider text-stone-500">
              <th className="px-4 py-3 cursor-pointer select-none hover:text-stone-700" onClick={() => setSortAsc(!sortAsc)}>
                Tanggal {sortAsc ? "▲" : "▼"}
              </th>
              <th className="px-4 py-3">Supplier</th>
              <th className="px-4 py-3">Produk</th>
              <th className="px-4 py-3 text-center">Qty</th>
              <th className="px-4 py-3 text-right">Harga Satuan</th>
              <th className="px-4 py-3 text-right">Ongkir</th>
              <th className="px-4 py-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-50">
            {purchasesLoading ? (
              <tr>
                <td colSpan={7} className="px-4 py-16 text-center text-stone-400">
                  Memuat data dari database...
                </td>
              </tr>
            ) : filteredPurchases.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-16 text-center text-stone-400">
                  Belum ada transaksi pembelian.
                </td>
              </tr>
            )}
            {filteredPurchases.map((p) => (
              <tr key={p.id} className="hover:bg-stone-50/60">
                <td className="px-4 py-3 text-stone-600">{fmtDate(p.tanggal)}</td>
                <td className="px-4 py-3 text-stone-700">{p.supplier}</td>
                <td className="px-4 py-3">
                  <span className="font-medium text-stone-800">{p.namaProduk}</span>
                  <span className="ml-2 font-mono text-xs text-stone-400">{p.sku}</span>
                </td>
                <td className="px-4 py-3 text-center font-mono text-stone-700">{p.qty}</td>
                <td className="px-4 py-3 text-right text-stone-700">{fmtRupiah(p.hargaSatuan)}</td>
                <td className="px-4 py-3 text-right text-stone-500">{p.ongkir > 0 ? fmtRupiah(p.ongkir) : "-"}</td>
                <td className="px-4 py-3 text-right font-medium text-stone-800">{fmtRupiah(p.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Modal Form ─────────────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto pt-10 pb-10">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-stone-800">Catat Pembelian</h2>
            <p className="mt-0.5 text-sm text-stone-400">
              Stok produk akan otomatis bertambah.
            </p>

            <div className="mt-5 space-y-4">
              {/* Pilih Produk */}
              <div>
                <label className="block text-xs font-medium text-stone-500 mb-1">Produk *</label>
                <select
                  value={form.sku}
                  onChange={(e) => handleSelectProduct(e.target.value)}
                  className={`w-full rounded-xl border px-3 py-2 text-sm outline-none transition-colors focus:ring-2 focus:ring-accent/30 ${
                    errors.sku ? "border-red-300 bg-red-50" : "border-stone-200"
                  }`}
                >
                  <option value="">-- Pilih Produk --</option>
                  {products
                    .filter((p) => p.status === "Aktif")
                    .map((p) => (
                      <option key={p.sku} value={p.sku}>
                        {p.sku} — {p.nama}
                      </option>
                    ))}
                </select>
                {errors.sku && <p className="mt-1 text-xs text-red-500">{errors.sku}</p>}
              </div>

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

              {/* Supplier (auto-filled, bisa diedit) */}
              <div>
                <label className="block text-xs font-medium text-stone-500 mb-1">Supplier</label>
                <input
                  type="text"
                  value={form.supplier}
                  onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                  placeholder="Otomatis dari produk"
                  className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/30"
                />
              </div>

              {/* Qty + Harga */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-500 mb-1">Qty *</label>
                  <input
                    type="number"
                    min="1"
                    value={form.qty}
                    onChange={(e) => setForm({ ...form, qty: e.target.value })}
                    placeholder="0"
                    className={`w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/30 ${
                      errors.qty ? "border-red-300 bg-red-50" : "border-stone-200"
                    }`}
                  />
                  {errors.qty && <p className="mt-0.5 text-[10px] text-red-500">{errors.qty}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-500 mb-1">Harga Satuan *</label>
                  <input
                    type="number"
                    min="0"
                    value={form.hargaSatuan}
                    onChange={(e) => setForm({ ...form, hargaSatuan: e.target.value })}
                    placeholder="0"
                    className={`w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/30 ${
                      errors.hargaSatuan ? "border-red-300 bg-red-50" : "border-stone-200"
                    }`}
                  />
                  {errors.hargaSatuan && <p className="mt-0.5 text-[10px] text-red-500">{errors.hargaSatuan}</p>}
                </div>
              </div>

              {/* Ongkir */}
              <div>
                <label className="block text-xs font-medium text-stone-500 mb-1">Ongkir</label>
                <input
                  type="number"
                  min="0"
                  value={form.ongkir}
                  onChange={(e) => setForm({ ...form, ongkir: e.target.value })}
                  placeholder="0"
                  className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/30"
                />
              </div>

              {/* Total auto */}
              <div className="rounded-xl bg-accent-light px-4 py-3">
                <span className="text-xs font-medium text-accent-dark">Total</span>
                <p className="text-lg font-semibold text-accent-dark">{fmtRupiah(total)}</p>
              </div>
            </div>

            {/* Tombol */}
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
                {saving ? "Menyimpan..." : "Simpan Pembelian"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
