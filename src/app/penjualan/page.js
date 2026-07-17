"use client";

import { useState, useMemo } from "react";
import { useStore } from "@/lib/ProductContext";
import { fmtDate } from "@/lib/helpers";
import { hitungDiskon } from "@/lib/diskon";

/* ── Helpers ─────────────────────────────────────────────── */
const fmtRupiah = (n) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

const today = () => new Date().toISOString().slice(0, 10);

const CHANNELS = ["Shopee", "WA", "Sekolah", "Event", "Reseller", "Lainnya"];

const EMPTY_FORM = {
  tanggal: today(),
  pembeli: "",
  channel: "Shopee",
  sku: "",
  qty: "",
  ongkir: "",
  status: "Lunas",
};

/* ── Komponen Utama ──────────────────────────────────────── */
export default function PenjualanPage() {
  const {
    products, updateStock,
    sales, salesLoading, addSale,
    customers, upsertCustomer,
    getHargaByChannel, nextInvoice,
    diskonList,
  } = useStore();

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  /* Filter & Sort */
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));
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

  const filteredSales = useMemo(() => {
    let result = sales;
    if (startDate) result = result.filter((s) => s.tanggal >= startDate);
    if (endDate) result = result.filter((s) => s.tanggal <= endDate);
    if (productSearch) {
      const q = productSearch.toLowerCase();
      result = result.filter(
        (s) => s.namaProduk.toLowerCase().includes(q) || s.sku.toLowerCase().includes(q)
      );
    }
    result = [...result].sort((a, b) => {
      const cmp = new Date(b.tanggal) - new Date(a.tanggal);
      return sortAsc ? -cmp : cmp;
    });
    return result;
  }, [sales, startDate, endDate, sortAsc, productSearch]);

  const filterSummary = useMemo(() => ({
    total: filteredSales.length,
    omzet: filteredSales.reduce((s, x) => s + x.omzet, 0),
    laba: filteredSales.reduce((s, x) => s + x.laba, 0),
  }), [filteredSales]);

  /* ─── Data turunan ───────────────────── */
  const selectedProduct = useMemo(
    () => products.find((p) => p.sku === form.sku) || null,
    [products, form.sku]
  );

  const hargaJual = selectedProduct
    ? getHargaByChannel(selectedProduct, form.channel)
    : 0;

  const qtyNum = Number(form.qty) || 0;
  const ongkirNum = Number(form.ongkir) || 0;
  const omzet = hargaJual * qtyNum;
  const laba = selectedProduct ? omzet - selectedProduct.hargaModal * qtyNum : 0;
  const stokTersedia = selectedProduct ? selectedProduct.stok : 0;

  /* ─── Kalkulasi Diskon ───────────────── */
  const diskonResult = useMemo(() => {
    if (!selectedProduct || !qtyNum) return { diskon: null, hematIDR: 0, hargaFinal: 0, marginWarning: false };
    // Filter diskon aktif untuk hari ini
    const todayDate = new Date().toISOString().slice(0, 10);
    const aktif = diskonList.filter(
      (d) => d.aktif && d.mulai <= todayDate && (!d.selesai || d.selesai >= todayDate)
    );
    // Hitung total cart (omzet + item lain jika multi-item — untuk sekarang single item)
    const totalCart = omzet;
    const hrg = getHargaByChannel(selectedProduct, form.channel);
    return hitungDiskon(
      { ...selectedProduct, hargaJual: hrg, id: selectedProduct.id, kategori: selectedProduct.kategori },
      qtyNum,
      totalCart,
      aktif
    );
  }, [selectedProduct, qtyNum, omzet, form.channel, diskonList, getHargaByChannel]);

  /* ─── Buka modal ─────────────────────── */
  const openAdd = () => {
    setForm({ ...EMPTY_FORM, tanggal: today() });
    setErrors({});
    setModalOpen(true);
  };

  /* ─── Validasi ───────────────────────── */
  const validate = () => {
    const e = {};
    if (!form.pembeli.trim()) e.pembeli = "Nama pembeli wajib diisi";
    if (!form.sku) e.sku = "Produk wajib dipilih";
    if (!form.qty || Number(form.qty) <= 0) e.qty = "Qty harus > 0";
    else if (qtyNum > stokTersedia) e.qty = `Stok tidak cukup! Tersedia: ${stokTersedia}`;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ─── Simpan ─────────────────────────── */
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!validate()) return;

    setSaving(true);

    const newSale = {
      invoice: nextInvoice(sales),
      tanggal: form.tanggal,
      pembeli: form.pembeli.trim(),
      channel: form.channel,
      sku: form.sku,
      namaProduk: selectedProduct?.nama || "",
      qty: qtyNum,
      hargaJual,
      ongkir: ongkirNum,
      omzet,
      laba: laba - diskonResult.hematIDR,
      status: form.status,
      diskon_id: diskonResult.diskon?.id || null,
      diskon_nilai: diskonResult.hematIDR,
      hemat: diskonResult.hematIDR,
    };

    const ok = await addSale(newSale);
    if (!ok) {
      setSaving(false);
      return;
    }

    await updateStock(form.sku, -qtyNum);
    await upsertCustomer(form.pembeli.trim(), form.tanggal);

    setSaving(false);
    setModalOpen(false);
  };

  /* ─── Render ─────────────────────────── */
  return (
    <div className="px-4 py-6 md:px-10 md:py-10">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-stone-800">Penjualan</h1>
          <p className="mt-1 text-sm text-stone-500">
            Catat transaksi penjualan multi-channel — stok otomatis berkurang, laba terhitung.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-dark self-start sm:self-auto"
        >
          <span className="text-base">+</span> Catat Penjualan
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
          <span>Omzet <span className="font-medium text-stone-600">{fmtRupiah(filterSummary.omzet)}</span></span>
          <span>Laba <span className="font-medium text-emerald-600">{fmtRupiah(filterSummary.laba)}</span></span>
        </div>
      </div>

      {/* Filter Panel */}
      {filterOpen && (
        <div className="mt-2 rounded-2xl border border-stone-200 bg-white p-4">
          {/* Mode tabs */}
          <div className="flex gap-1 mb-3">
            {[
              ["tanggal", "Tanggal"],
              ["produk", "Nama Produk/SKU"],
            ].map(([val, label]) => (
              <button
                key={val}
                onClick={() => setFilterMode(val)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  filterMode === val ? "bg-accent text-white" : "bg-stone-100 text-stone-500 hover:bg-stone-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Tanggal mode */}
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
                  ["Hari ini", () => { const t = new Date().toISOString().slice(0,10); setStartDate(t); setEndDate(t); }],
                  ["7 hari", () => { const d=new Date();d.setDate(d.getDate()-6); setStartDate(d.toISOString().slice(0,10)); setEndDate(new Date().toISOString().slice(0,10)); }],
                  ["Bulan ini", () => { const d=new Date();d.setDate(1); setStartDate(d.toISOString().slice(0,10)); setEndDate(new Date().toISOString().slice(0,10)); }],
                  ["Semua", () => { setStartDate(""); setEndDate(""); }],
                ].map(([label, fn]) => (
                  <button key={label} onClick={fn} className="rounded-lg px-2.5 py-1.5 text-[11px] font-medium bg-stone-100 text-stone-500 hover:bg-stone-200 transition-colors">{label}</button>
                ))}
              </div>
            </div>
          )}

          {/* Produk mode */}
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
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="border-b border-stone-100 bg-stone-50 text-left text-xs font-medium uppercase tracking-wider text-stone-500">
              <th className="px-3 py-3">Invoice</th>
              <th className="px-3 py-3 cursor-pointer select-none hover:text-stone-700" onClick={() => setSortAsc(!sortAsc)}>
                Tanggal {sortAsc ? "▲" : "▼"}
              </th>
              <th className="px-3 py-3">Pembeli</th>
              <th className="px-3 py-3 text-center">Channel</th>
              <th className="px-3 py-3">Produk</th>
              <th className="px-3 py-3 text-center">Qty</th>
              <th className="px-3 py-3 text-right">Harga</th>
              <th className="px-3 py-3 text-right">Diskon</th>
              <th className="px-3 py-3 text-right">Omzet</th>
              <th className="px-3 py-3 text-right">Laba</th>
              <th className="px-3 py-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-50">
            {salesLoading ? (
              <tr>
                <td colSpan={11} className="px-4 py-16 text-center text-stone-400">
                  Memuat data dari database...
                </td>
              </tr>
            ) : filteredSales.length === 0 && (
              <tr>
                <td colSpan={11} className="px-4 py-16 text-center text-stone-400">
                  Belum ada transaksi penjualan.
                </td>
              </tr>
            )}
            {filteredSales.map((s) => (
              <tr key={s.id} className="hover:bg-stone-50/60">
                <td className="px-3 py-3 font-mono text-xs font-medium text-accent-dark">{s.invoice}</td>
                <td className="px-3 py-3 text-stone-500 text-xs">{fmtDate(s.tanggal)}</td>
                <td className="px-3 py-3 font-medium text-stone-800">{s.pembeli}</td>
                <td className="px-3 py-3 text-center">
                  <span className="inline-flex rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-600">
                    {s.channel}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <span className="text-stone-800">{s.namaProduk}</span>
                  <span className="ml-1.5 font-mono text-[10px] text-stone-400">{s.sku}</span>
                </td>
                <td className="px-3 py-3 text-center font-mono text-stone-700">{s.qty}</td>
                <td className="px-3 py-3 text-right text-stone-600">{fmtRupiah(s.hargaJual)}</td>
                <td className="px-3 py-3 text-right text-emerald-600 font-medium">
                  {s.hemat > 0 ? `-${fmtRupiah(s.hemat)}` : "—"}
                </td>
                <td className="px-3 py-3 text-right font-medium text-stone-800">{fmtRupiah(s.omzet)}</td>
                <td className="px-3 py-3 text-right font-medium text-emerald-600">{fmtRupiah(s.laba)}</td>
                <td className="px-3 py-3 text-center">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                    s.status === "Lunas" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                  }`}>
                    {s.status}
                  </span>
                </td>
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
            <h2 className="text-lg font-semibold text-stone-800">Catat Penjualan</h2>
            <p className="mt-0.5 text-sm text-stone-400">
              Stok berkurang otomatis. Invoice: {nextInvoice(sales)}
            </p>

            <div className="mt-5 space-y-4">
              {/* Pembeli + Tanggal */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-500 mb-1">Pembeli *</label>
                  <input
                    type="text"
                    value={form.pembeli}
                    onChange={(e) => setForm({ ...form, pembeli: e.target.value })}
                    placeholder="Nama pembeli"
                    className={`w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/30 ${
                      errors.pembeli ? "border-red-300 bg-red-50" : "border-stone-200"
                    }`}
                  />
                  {errors.pembeli && <p className="mt-1 text-xs text-red-500">{errors.pembeli}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-500 mb-1">Tanggal</label>
                  <input
                    type="date"
                    value={form.tanggal}
                    onChange={(e) => setForm({ ...form, tanggal: e.target.value })}
                    className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/30"
                  />
                </div>
              </div>

              {/* Channel */}
              <div>
                <label className="block text-xs font-medium text-stone-500 mb-1">Channel</label>
                <div className="flex flex-wrap gap-1.5">
                  {CHANNELS.map((ch) => (
                    <button
                      key={ch}
                      type="button"
                      onClick={() => setForm({ ...form, channel: ch })}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                        form.channel === ch
                          ? "bg-accent text-white"
                          : "bg-stone-100 text-stone-500 hover:bg-stone-200"
                      }`}
                    >
                      {ch}
                    </button>
                  ))}
                </div>
              </div>

              {/* Produk */}
              <div>
                <label className="block text-xs font-medium text-stone-500 mb-1">Produk *</label>
                <select
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                  className={`w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/30 ${
                    errors.sku ? "border-red-300 bg-red-50" : "border-stone-200"
                  }`}
                >
                  <option value="">-- Pilih Produk --</option>
                  {products
                    .filter((p) => p.status === "Aktif")
                    .map((p) => (
                      <option key={p.sku} value={p.sku}>
                        {p.sku} — {p.nama} (stok: {p.stok})
                      </option>
                    ))}
                </select>
                {errors.sku && <p className="mt-1 text-xs text-red-500">{errors.sku}</p>}
              </div>

              {/* Qty + Ongkir */}
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
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-medium text-stone-500 mb-1">Status</label>
                <div className="flex gap-2">
                  {["Lunas", "Pending"].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setForm({ ...form, status: s })}
                      className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                        form.status === s
                          ? s === "Lunas" ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"
                          : "bg-stone-100 text-stone-500 hover:bg-stone-200"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ringkasan */}
              {selectedProduct && (
                <div className="rounded-xl bg-stone-50 p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-stone-500">Harga {form.channel}</span>
                    <span className="font-medium text-stone-700">{fmtRupiah(hargaJual)}</span>
                  </div>
                  {diskonResult.diskon && (
                    <>
                      <div className="flex justify-between text-emerald-600">
                        <span className="flex items-center gap-1">
                          <span className="inline-flex items-center rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold">
                            {diskonResult.diskon.jenis === "PERSEN"
                              ? `${Number(diskonResult.diskon.nilai)}%`
                              : diskonResult.diskon.jenis === "NOMINAL"
                              ? "Rp OFF"
                              : diskonResult.diskon.jenis === "BELI_X_GRATIS_Y"
                              ? "BeliX"
                              : "Bundle"}
                          </span>
                          {diskonResult.diskon.nama}
                        </span>
                        <span>-{fmtRupiah(diskonResult.hematIDR)}</span>
                      </div>
                      {diskonResult.marginWarning && (
                        <p className="text-[10px] text-amber-600">⚠ Di bawah harga modal!</p>
                      )}
                    </>
                  )}
                  <div className="flex justify-between">
                    <span className="text-stone-500">
                      Omzet ({qtyNum} × {fmtRupiah(hargaJual)})
                      {diskonResult.diskon && <span className="text-stone-400 line-through ml-1">{fmtRupiah(omzet)}</span>}
                    </span>
                    <span className="font-semibold text-stone-800">
                      {fmtRupiah(diskonResult.diskon ? diskonResult.hargaFinal : omzet)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-stone-200 pt-2">
                    <span className="text-stone-500">Estimasi Laba</span>
                    <span className={`font-semibold ${diskonResult.marginWarning ? "text-amber-600" : "text-emerald-600"}`}>
                      {fmtRupiah(laba - diskonResult.hematIDR)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-stone-400">Stok tersedia</span>
                    <span className={`font-mono ${stokTersedia <= 0 ? "text-red-500" : "text-stone-500"}`}>
                      {stokTersedia}
                    </span>
                  </div>
                </div>
              )}
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
                {saving ? "Menyimpan..." : "Simpan Penjualan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
