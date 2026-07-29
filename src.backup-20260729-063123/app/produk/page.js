"use client";

import { useState } from "react";
import { useProducts } from "@/lib/ProductContext";

const EMPTY_FORM = {
  sku: "",
  nama: "",
  kategori: "",
  supplier: "",
  hargaModal: "",
  hargaShopee: "",
  hargaWa: "",
  hargaReseller: "",
  beratGr: "",
  minStok: "",
  status: "Aktif",
};

const CHANNEL_FIELDS = [
  { key: "hargaModal", label: "Harga Modal" },
  { key: "hargaShopee", label: "Harga Shopee" },
  { key: "hargaWa", label: "Harga WA" },
  { key: "hargaReseller", label: "Harga Reseller" },
];

const STATUS_OPTIONS = ["Aktif", "Nonaktif"];

/* ── Helpers ─────────────────────────────────────────────── */
const fmtRupiah = (n) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 })
    .format(n);

const nextSku = (products) => {
  const max = products.reduce((m, p) => {
    const num = parseInt(p.sku.replace("NT", ""), 10);
    return num > m ? num : m;
  }, 0);
  return `NT${String(max + 1).padStart(3, "0")}`;
};

/* ── Komponen label menurun ───────────────────────────────── */
function StackLabel({ text }) {
  const words = text.split(" ");
  return (
    <span className="inline-flex flex-col items-center leading-tight">
      {words.map((w, i) => (
        <span key={i}>{w}</span>
      ))}
    </span>
  );
}

/* ── Komponen Utama ──────────────────────────────────────── */
export default function ProdukPage() {
  const { products, productsLoading, addProduct, updateProduct, deleteProduct } = useProducts();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSku, setEditingSku] = useState(null); // null = tambah baru
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);

  /* ─── Buka modal ─────────────────────── */
  const openAdd = () => {
    setEditingSku(null);
    setForm({ ...EMPTY_FORM, sku: nextSku(products) });
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (product) => {
    setEditingSku(product.sku);
    setForm({
      sku: product.sku,
      nama: product.nama,
      kategori: product.kategori,
      supplier: product.supplier,
      hargaModal: product.hargaModal.toString(),
      hargaShopee: product.hargaShopee.toString(),
      hargaWa: product.hargaWa.toString(),
      hargaReseller: product.hargaReseller.toString(),
      beratGr: product.beratGr.toString(),
      minStok: product.minStok.toString(),
      status: product.status,
    });
    setErrors({});
    setModalOpen(true);
  };

  /* ─── Validasi ───────────────────────── */
  const validate = () => {
    const e = {};
    // SKU
    const skuTrim = form.sku.trim();
    if (!skuTrim) {
      e.sku = "SKU wajib diisi";
    } else if (!/^[A-Z0-9]+$/i.test(skuTrim)) {
      e.sku = "SKU hanya boleh huruf & angka";
    } else {
      const dupe = products.find(
        (p) => p.sku.toUpperCase() === skuTrim.toUpperCase() && p.sku !== editingSku
      );
      if (dupe) e.sku = `SKU "${skuTrim}" sudah dipakai oleh produk lain`;
    }
    // Nama
    if (!form.nama.trim()) e.nama = "Nama produk wajib diisi";
    [
      "hargaModal",
      "hargaShopee",
      "hargaWa",
      "hargaReseller",
      "beratGr",
      "minStok",
    ].forEach((k) => {
      const v = form[k];
      if (v === "" || isNaN(Number(v)) || Number(v) < 0) {
        e[k] = "Harus berupa angka ≥ 0";
      }
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ─── Simpan ─────────────────────────── */
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!validate()) return;

    setSaving(true);

    const data = {
      sku: form.sku.trim().toUpperCase(),
      nama: form.nama.trim(),
      kategori: form.kategori.trim(),
      supplier: form.supplier.trim(),
      hargaModal: Number(form.hargaModal),
      hargaShopee: Number(form.hargaShopee),
      hargaWa: Number(form.hargaWa),
      hargaReseller: Number(form.hargaReseller),
      beratGr: Number(form.beratGr),
      minStok: Number(form.minStok),
      status: form.status,
    };

    // Stok awal 0 hanya untuk produk baru
    if (!editingSku) {
      data.stok = 0;
    }

    let ok;
    if (editingSku) {
      ok = await updateProduct(editingSku, data);
    } else {
      ok = await addProduct(data);
    }

    setSaving(false);
    if (ok) setModalOpen(false);
  };

  /* ─── Hapus ──────────────────────────── */
  const confirmDelete = (sku) => setDeleteTarget(sku);

  const handleDelete = async () => {
    await deleteProduct(deleteTarget);
    setDeleteTarget(null);
  };

  /* ─── Filter & Search ────────────────── */
  const [searchTerm, setSearchTerm] = useState("");
  const [filterKategori, setFilterKategori] = useState("");
  const [filterSupplier, setFilterSupplier] = useState("");

  const filteredProducts = products.filter((p) => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      !q ||
      p.sku.toLowerCase().includes(q) ||
      p.nama.toLowerCase().includes(q);
    const matchKategori = !filterKategori || p.kategori === filterKategori;
    const matchSupplier = !filterSupplier || p.supplier === filterSupplier;
    return matchSearch && matchKategori && matchSupplier;
  });

  const allKategori = [...new Set(products.map((p) => p.kategori).filter(Boolean))].sort();
  const allSupplier = [...new Set(products.map((p) => p.supplier).filter(Boolean))].sort();

  /* ─── Render ─────────────────────────── */
  return (
    <div className="px-4 py-6 md:px-10 md:py-10">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-stone-800">Produk</h1>
          <p className="mt-1 text-sm text-stone-500">
            Kelola semua produk robotik — tambah, edit, dan atur harga multi-channel.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-dark self-start sm:self-auto"
        >
          <span className="text-base">+</span> Tambah Produk
        </button>
      </div>

      {/* Filter Bar */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400"
            fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
          </svg>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari SKU atau nama produk..."
            className="w-full rounded-xl border border-stone-200 bg-white py-2 pl-9 pr-3 text-sm outline-none transition-colors focus:ring-2 focus:ring-accent/30"
          />
        </div>

        {/* Filter Kategori */}
        <select
          value={filterKategori}
          onChange={(e) => setFilterKategori(e.target.value)}
          className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-600 outline-none transition-colors focus:ring-2 focus:ring-accent/30"
        >
          <option value="">Semua Kategori</option>
          {allKategori.map((k) => (
            <option key={k} value={k}>{k}</option>
          ))}
        </select>

        {/* Filter Supplier */}
        <select
          value={filterSupplier}
          onChange={(e) => setFilterSupplier(e.target.value)}
          className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-600 outline-none transition-colors focus:ring-2 focus:ring-accent/30"
        >
          <option value="">Semua Supplier</option>
          {allSupplier.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        {/* Reset */}
        {(searchTerm || filterKategori || filterSupplier) && (
          <button
            onClick={() => { setSearchTerm(""); setFilterKategori(""); setFilterSupplier(""); }}
            className="rounded-xl px-3 py-2 text-xs font-medium text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600"
          >
            ✕ Reset
          </button>
        )}

        {/* Hitung */}
        <span className="ml-auto text-xs text-stone-400">
          {filteredProducts.length} dari {products.length} produk
        </span>
      </div>

      {/* Tabel */}
      <div className="mt-6 overflow-x-auto rounded-2xl border border-stone-200 bg-white">
        <table className="w-full min-w-[1200px] text-sm">
          <thead>
            <tr className="border-b border-stone-100 bg-stone-50 text-xs font-medium uppercase tracking-wider text-stone-500">
              <th className="px-2 py-3 text-center"><StackLabel text="SKU" /></th>
              <th className="px-2 py-3 text-left"><StackLabel text="Nama" /></th>
              <th className="px-2 py-3 text-left"><StackLabel text="Kategori" /></th>
              <th className="px-2 py-3 text-left"><StackLabel text="Supplier" /></th>
              <th className="px-2 py-3 text-center"><StackLabel text="Harga Modal" /></th>
              <th className="px-2 py-3 text-center"><StackLabel text="Harga Shopee" /></th>
              <th className="px-2 py-3 text-center"><StackLabel text="Harga WA" /></th>
              <th className="px-2 py-3 text-center"><StackLabel text="Harga Reseller" /></th>
              <th className="px-2 py-3 text-center"><StackLabel text="Berat (gr)" /></th>
              <th className="px-2 py-3 text-center"><StackLabel text="Stok" /></th>
              <th className="px-2 py-3 text-center"><StackLabel text="Min Stok" /></th>
              <th className="px-2 py-3 text-center"><StackLabel text="Status" /></th>
              <th className="px-2 py-3 text-center"><StackLabel text="Aksi" /></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-50">
            {productsLoading ? (
              <tr>
                <td colSpan={13} className="px-4 py-16 text-center text-stone-400">
                  Memuat data dari database...
                </td>
              </tr>
            ) : filteredProducts.length === 0 && (
              <tr>
                <td colSpan={13} className="px-4 py-16 text-center text-stone-400">
                  {products.length === 0
                    ? "Belum ada produk. Klik \"Tambah Produk\" untuk memulai."
                    : "Tidak ada produk yang cocok dengan filter."}
                </td>
              </tr>
            )}
            {filteredProducts.map((p) => {
              const isLowStock = p.stok < p.minStok;
              return (
                <tr
                  key={p.sku}
                  className={
                    isLowStock
                      ? "bg-red-50/60 hover:bg-red-50"
                      : "hover:bg-stone-50/60"
                  }
                >
                  <td className="px-2 py-3 font-mono text-xs font-medium text-stone-500 text-center">{p.sku}</td>
                  <td className="px-2 py-3 font-medium text-stone-800">{p.nama}</td>
                  <td className="px-2 py-3 text-stone-600">{p.kategori}</td>
                  <td className="px-2 py-3 text-stone-600">{p.supplier}</td>
                  <td className="px-2 py-3 text-center text-stone-700">{fmtRupiah(p.hargaModal)}</td>
                  <td className="px-2 py-3 text-center text-stone-700">{fmtRupiah(p.hargaShopee)}</td>
                  <td className="px-2 py-3 text-center text-stone-700">{fmtRupiah(p.hargaWa)}</td>
                  <td className="px-2 py-3 text-center text-stone-700">{fmtRupiah(p.hargaReseller)}</td>
                  <td className="px-2 py-3 text-center text-stone-600">{p.beratGr} gr</td>
                  <td className={`px-2 py-3 text-center font-mono font-medium ${isLowStock ? "text-red-600" : "text-stone-700"}`}>
                    {p.stok}
                    {isLowStock && (
                      <span className="ml-1.5 inline-flex items-center rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-700">
                        !
                      </span>
                    )}
                  </td>
                  <td className="px-2 py-3 text-center text-stone-400">{p.minStok}</td>
                  <td className="px-2 py-3 text-center">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        p.status === "Aktif"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-stone-100 text-stone-500"
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="px-2 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => openEdit(p)}
                        className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-800"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => confirmDelete(p.sku)}
                        className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-stone-400 transition-colors hover:bg-red-50 hover:text-red-600"
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Modal Form ─────────────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto pt-10 pb-10">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={() => setModalOpen(false)}
          />

          {/* Card */}
          <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-stone-800">
              {editingSku ? `Edit Produk (${editingSku})` : "Tambah Produk Baru"}
            </h2>
            <p className="mt-0.5 text-sm text-stone-400">
              SKU harus unik — tidak boleh sama dengan produk lain.
            </p>

            <div className="mt-5 space-y-4">
              {/* SKU */}
              <div>
                <label className="block text-xs font-medium text-stone-500 mb-1">SKU *</label>
                <input
                  type="text"
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value.toUpperCase() })}
                  placeholder="cth. NT005"
                  className={`w-full rounded-xl border px-3 py-2 text-sm font-mono outline-none transition-colors focus:ring-2 focus:ring-accent/30 ${
                    errors.sku ? "border-red-300 bg-red-50" : "border-stone-200"
                  }`}
                />
                {errors.sku && <p className="mt-1 text-xs text-red-500">{errors.sku}</p>}
              </div>

              {/* Nama */}
              <div>
                <label className="block text-xs font-medium text-stone-500 mb-1">Nama Produk *</label>
                <input
                  type="text"
                  value={form.nama}
                  onChange={(e) => setForm({ ...form, nama: e.target.value })}
                  placeholder="cth. Robot Line Follower"
                  className={`w-full rounded-xl border px-3 py-2 text-sm outline-none transition-colors focus:ring-2 focus:ring-accent/30 ${
                    errors.nama ? "border-red-300 bg-red-50" : "border-stone-200"
                  }`}
                />
                {errors.nama && <p className="mt-1 text-xs text-red-500">{errors.nama}</p>}
              </div>

              {/* Kategori & Supplier */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-500 mb-1">Kategori</label>
                  <input
                    type="text"
                    value={form.kategori}
                    onChange={(e) => setForm({ ...form, kategori: e.target.value })}
                    placeholder="cth. Robot Edukasi"
                    className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-500 mb-1">Supplier</label>
                  <input
                    type="text"
                    value={form.supplier}
                    onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                    placeholder="cth. TechKids"
                    className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/30"
                  />
                </div>
              </div>

              {/* 4 Harga */}
              <fieldset className="rounded-xl border border-stone-100 bg-stone-50/50 p-3">
                <legend className="text-xs font-medium text-stone-500 px-1">Harga Multi-Channel</legend>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {CHANNEL_FIELDS.map((f) => (
                    <div key={f.key}>
                      <label className="block text-[11px] font-medium text-stone-400 mb-0.5">{f.label} *</label>
                      <input
                        type="number"
                        min="0"
                        value={form[f.key]}
                        onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                        placeholder="0"
                        className={`w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/30 ${
                          errors[f.key] ? "border-red-300 bg-red-50" : "border-stone-200"
                        }`}
                      />
                      {errors[f.key] && <p className="mt-0.5 text-[10px] text-red-500">{errors[f.key]}</p>}
                    </div>
                  ))}
                </div>
              </fieldset>

              {/* Berat, Min Stok */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: "beratGr", label: "Berat (gr) *" },
                  { key: "minStok", label: "Min Stok *" },
                ].map((f) => (
                  <div key={f.key}>
                    <label className="block text-xs font-medium text-stone-500 mb-1">{f.label}</label>
                    <input
                      type="number"
                      min="0"
                      value={form[f.key]}
                      onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                      placeholder="0"
                      className={`w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/30 ${
                        errors[f.key] ? "border-red-300 bg-red-50" : "border-stone-200"
                      }`}
                    />
                    {errors[f.key] && <p className="mt-0.5 text-[10px] text-red-500">{errors[f.key]}</p>}
                  </div>
                ))}
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-medium text-stone-500 mb-1">Status</label>
                <div className="flex gap-2">
                  {STATUS_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setForm({ ...form, status: opt })}
                      className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                        form.status === opt
                          ? "bg-accent text-white"
                          : "bg-stone-100 text-stone-500 hover:bg-stone-200"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
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
                {saving ? "Menyimpan..." : editingSku ? "Simpan Perubahan" : "Simpan Produk"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Hapus ────────────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={() => setDeleteTarget(null)}
          />
          <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-stone-800">Hapus Produk?</h3>
            <p className="mt-1 text-sm text-stone-500">
              Produk <span className="font-mono font-medium text-stone-700">{deleteTarget}</span> akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="rounded-xl px-4 py-2.5 text-sm font-medium text-stone-500 transition-colors hover:bg-stone-100"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                className="rounded-xl bg-red-500 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-600"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
