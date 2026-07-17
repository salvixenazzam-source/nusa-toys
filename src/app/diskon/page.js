"use client";

import { useState, useMemo } from "react";
import { useStore } from "@/lib/ProductContext";
import { fmtDate } from "@/lib/helpers";

/* ── Helpers ─────────────────────────────────────────────── */
const fmtRupiah = (n) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

const today = () => new Date().toISOString().slice(0, 10);

const JENIS_OPTIONS = [
  { value: "PERSEN", label: "Persentase (%)" },
  { value: "NOMINAL", label: "Nominal (Rp)" },
  { value: "BELI_X_GRATIS_Y", label: "Beli X Gratis Y" },
  { value: "BUNDLE", label: "Harga Bundle" },
];

const BERLAKU_OPTIONS = [
  { value: "SEMUA", label: "Semua Produk" },
  { value: "KATEGORI", label: "Kategori Tertentu" },
  { value: "SKU", label: "SKU Tertentu" },
];

const EMPTY_FORM = {
  nama: "",
  jenis: "PERSEN",
  nilai: "",
  nilai_gratis: "",
  beli_min_qty: "",
  min_pembelian: "",
  berlaku_untuk: "SEMUA",
  mulai: today(),
  selesai: "",
  kuota: "",
  aktif: true,
};

/* ── Label status ──────────────────── */
function labelStatus(d) {
  const now = today();
  if (!d.aktif) return { label: "Nonaktif", cls: "bg-stone-100 text-stone-500" };
  if (d.selesai && d.selesai < now) return { label: "Kedaluwarsa", cls: "bg-red-50 text-red-600" };
  return { label: "Aktif", cls: "bg-emerald-50 text-emerald-700" };
}

function jenisLabel(jenis) {
  const map = { PERSEN: "%", NOMINAL: "Rp", BELI_X_GRATIS_Y: "BeliX", BUNDLE: "Bundle" };
  return map[jenis] || jenis;
}

function nilaiLabel(d) {
  if (d.jenis === "PERSEN") return `${Number(d.nilai)}%`;
  if (d.jenis === "NOMINAL") return fmtRupiah(d.nilai);
  if (d.jenis === "BUNDLE") return fmtRupiah(d.nilai);
  if (d.jenis === "BELI_X_GRATIS_Y") return `Beli ${d.beli_min_qty} Gratis ${d.nilai_gratis}`;
  return `${d.nilai}`;
}

/* ── Komponen Utama ──────────────────────────────────────── */
export default function DiskonPage() {
  const {
    diskonList, diskonLoading,
    addDiskon, updateDiskon, toggleDiskon, deleteDiskon,
    products,
  } = useStore();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formKategori, setFormKategori] = useState([]);      // string[]
  const [formProdukIds, setFormProdukIds] = useState([]);     // UUID[]
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  /* Filter */
  const [filterStatus, setFilterStatus] = useState("");
  const [filterJenis, setFilterJenis] = useState("");

  const filtered = useMemo(() => {
    let result = diskonList;
    if (filterJenis) result = result.filter((d) => d.jenis === filterJenis);
    if (filterStatus === "aktif") result = result.filter((d) => d.aktif);
    if (filterStatus === "nonaktif") result = result.filter((d) => !d.aktif);
    return result;
  }, [diskonList, filterJenis, filterStatus]);

  /* Kategori unik dari produk */
  const allKategori = useMemo(
    () => [...new Set(products.map((p) => p.kategori).filter(Boolean))].sort(),
    [products]
  );

  /* ─── Buka modal ─────────────────────── */
  const openAdd = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, mulai: today() });
    setFormKategori([]);
    setFormProdukIds([]);
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (d) => {
    setEditingId(d.id);
    setForm({
      nama: d.nama,
      jenis: d.jenis,
      nilai: d.nilai != null ? String(d.nilai) : "",
      nilai_gratis: d.nilai_gratis != null ? String(d.nilai_gratis) : "",
      beli_min_qty: d.beli_min_qty != null ? String(d.beli_min_qty) : "",
      min_pembelian: d.min_pembelian != null ? String(d.min_pembelian) : "",
      berlaku_untuk: d.berlaku_untuk,
      mulai: d.mulai,
      selesai: d.selesai || "",
      kuota: d.kuota != null ? String(d.kuota) : "",
      aktif: d.aktif,
    });
    setFormKategori(d.kategori_list || []);
    setFormProdukIds(d.produk_ids || []);
    setErrors({});
    setModalOpen(true);
  };

  /* ─── Validasi ───────────────────────── */
  const validate = () => {
    const e = {};
    if (!form.nama.trim()) e.nama = "Nama diskon wajib diisi";
    const nilaiNum = Number(form.nilai);
    if (form.nilai === "" || isNaN(nilaiNum) || nilaiNum < 0) e.nilai = "Nilai harus ≥ 0";
    if (form.jenis === "BELI_X_GRATIS_Y") {
      if (!form.beli_min_qty || Number(form.beli_min_qty) <= 0) e.beli_min_qty = "Beli min qty harus > 0";
      if (!form.nilai_gratis || Number(form.nilai_gratis) <= 0) e.nilai_gratis = "Unit gratis harus > 0";
    }
    if (form.berlaku_untuk === "KATEGORI" && formKategori.length === 0) {
      e.berlaku_untuk = "Pilih minimal 1 kategori";
    }
    if (form.berlaku_untuk === "SKU" && formProdukIds.length === 0) {
      e.berlaku_untuk = "Pilih minimal 1 produk";
    }
    if (!form.mulai) e.mulai = "Tanggal mulai wajib diisi";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ─── Simpan ─────────────────────────── */
  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);

    const data = {
      nama: form.nama.trim(),
      jenis: form.jenis,
      nilai: Number(form.nilai),
      nilai_gratis: form.jenis === "BELI_X_GRATIS_Y" ? Number(form.nilai_gratis) : null,
      beli_min_qty: form.jenis === "BELI_X_GRATIS_Y" ? Number(form.beli_min_qty) : null,
      min_pembelian: form.min_pembelian ? Number(form.min_pembelian) : null,
      berlaku_untuk: form.berlaku_untuk,
      mulai: form.mulai,
      selesai: form.selesai || null,
      kuota: form.kuota ? Number(form.kuota) : null,
      aktif: form.aktif,
      updated_at: new Date().toISOString(),
    };

    let ok;
    if (editingId) {
      ok = await updateDiskon(editingId, data, formKategori, formProdukIds);
    } else {
      ok = await addDiskon(data, formKategori, formProdukIds);
    }

    setSaving(false);
    if (ok) setModalOpen(false);
  };

  /* ─── Toggle ─────────────────────────── */
  const handleToggle = async (d) => {
    await toggleDiskon(d.id, !d.aktif);
  };

  /* ─── Hapus ──────────────────────────── */
  const confirmDelete = (id) => setDeleteTarget(id);
  const handleDelete = async () => {
    await deleteDiskon(deleteTarget);
    setDeleteTarget(null);
  };

  /* ─── Render ─────────────────────────── */
  return (
    <div className="px-4 py-6 md:px-10 md:py-10">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-stone-800">Diskon</h1>
          <p className="mt-1 text-sm text-stone-500">
            Kelola promo dan diskon — terapkan ke semua produk, kategori, atau SKU tertentu.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-dark self-start sm:self-auto"
        >
          <span className="text-base">+</span> Tambah Diskon
        </button>
      </div>

      {/* Filter Bar */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <select
          value={filterJenis}
          onChange={(e) => setFilterJenis(e.target.value)}
          className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-600 outline-none focus:ring-2 focus:ring-accent/30"
        >
          <option value="">Semua Jenis</option>
          {JENIS_OPTIONS.map((j) => (
            <option key={j.value} value={j.value}>{j.label}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-600 outline-none focus:ring-2 focus:ring-accent/30"
        >
          <option value="">Semua Status</option>
          <option value="aktif">Aktif</option>
          <option value="nonaktif">Nonaktif</option>
        </select>
        {(filterStatus || filterJenis) && (
          <button
            onClick={() => { setFilterStatus(""); setFilterJenis(""); }}
            className="rounded-xl px-3 py-2 text-xs font-medium text-stone-400 hover:text-stone-600"
          >
            ✕ Reset
          </button>
        )}
        <span className="ml-auto text-xs text-stone-400">
          {filtered.length} diskon
        </span>
      </div>

      {/* Tabel */}
      <div className="mt-6 overflow-x-auto rounded-2xl border border-stone-200 bg-white">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="border-b border-stone-100 bg-stone-50 text-left text-xs font-medium uppercase tracking-wider text-stone-500">
              <th className="px-3 py-3">Nama</th>
              <th className="px-3 py-3 text-center">Jenis</th>
              <th className="px-3 py-3 text-center">Nilai</th>
              <th className="px-3 py-3">Berlaku</th>
              <th className="px-3 py-3 text-center">Periode</th>
              <th className="px-3 py-3 text-center">Kuota</th>
              <th className="px-3 py-3 text-center">Status</th>
              <th className="px-3 py-3 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-50">
            {diskonLoading ? (
              <tr>
                <td colSpan={8} className="px-4 py-16 text-center text-stone-400">
                  Memuat data dari database...
                </td>
              </tr>
            ) : filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-16 text-center text-stone-400">
                  Belum ada diskon. Klik "Tambah Diskon" untuk mulai.
                </td>
              </tr>
            )}
            {filtered.map((d) => {
              const st = labelStatus(d);
              return (
                <tr key={d.id} className="hover:bg-stone-50/60">
                  <td className="px-3 py-3 font-medium text-stone-800">{d.nama}</td>
                  <td className="px-3 py-3 text-center">
                    <span className="inline-flex rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-600">
                      {jenisLabel(d.jenis)}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center font-medium text-stone-700">
                    {nilaiLabel(d)}
                  </td>
                  <td className="px-3 py-3 text-xs text-stone-500">
                    {d.berlaku_untuk === "SEMUA" && "Semua Produk"}
                    {d.berlaku_untuk === "KATEGORI" && `${(d.kategori_list || []).length} kategori`}
                    {d.berlaku_untuk === "SKU" && `${(d.produk_ids || []).length} SKU`}
                    {d.min_pembelian && <span className="block">Min: {fmtRupiah(d.min_pembelian)}</span>}
                  </td>
                  <td className="px-3 py-3 text-center text-xs text-stone-500">
                    {fmtDate(d.mulai)}
                    {d.selesai ? ` → ${fmtDate(d.selesai)}` : " (selamanya)"}
                  </td>
                  <td className="px-3 py-3 text-center text-xs font-mono text-stone-500">
                    {d.kuota != null ? `${d.kuota_terpakai || 0}/${d.kuota}` : "∞"}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${st.cls}`}>
                      {st.label}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => openEdit(d)}
                        className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-stone-500 hover:bg-stone-100 hover:text-stone-800"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggle(d)}
                        className={`rounded-lg px-2.5 py-1.5 text-xs font-medium ${
                          d.aktif
                            ? "text-amber-600 hover:bg-amber-50"
                            : "text-emerald-600 hover:bg-emerald-50"
                        }`}
                      >
                        {d.aktif ? "Nonaktifkan" : "Aktifkan"}
                      </button>
                      <button
                        onClick={() => confirmDelete(d.id)}
                        className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-stone-400 hover:bg-red-50 hover:text-red-600"
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

      {/* ── Modal Form ───────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto pt-10 pb-10">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-stone-800">
              {editingId ? "Edit Diskon" : "Tambah Diskon Baru"}
            </h2>
            <p className="mt-0.5 text-sm text-stone-400">
              Sistem otomatis memilih diskon terbaik yang berlaku untuk pembeli.
            </p>

            <div className="mt-5 space-y-4">
              {/* Nama */}
              <div>
                <label className="block text-xs font-medium text-stone-500 mb-1">Nama Diskon *</label>
                <input
                  type="text"
                  value={form.nama}
                  onChange={(e) => setForm({ ...form, nama: e.target.value })}
                  placeholder="cth. Flash Sale Lebaran"
                  className={`w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/30 ${
                    errors.nama ? "border-red-300 bg-red-50" : "border-stone-200"
                  }`}
                />
                {errors.nama && <p className="mt-1 text-xs text-red-500">{errors.nama}</p>}
              </div>

              {/* Jenis */}
              <div>
                <label className="block text-xs font-medium text-stone-500 mb-1">Jenis Diskon</label>
                <div className="flex flex-wrap gap-1.5">
                  {JENIS_OPTIONS.map((j) => (
                    <button
                      key={j.value}
                      type="button"
                      onClick={() => setForm({ ...form, jenis: j.value, nilai_gratis: "", beli_min_qty: "" })}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                        form.jenis === j.value
                          ? "bg-accent text-white"
                          : "bg-stone-100 text-stone-500 hover:bg-stone-200"
                      }`}
                    >
                      {j.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Nilai */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-500 mb-1">
                    {form.jenis === "PERSEN" ? "Persentase (%) *" : form.jenis === "BUNDLE" ? "Harga Bundle (Rp) *" : "Nilai Potongan (Rp) *"}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.nilai}
                    onChange={(e) => setForm({ ...form, nilai: e.target.value })}
                    placeholder="0"
                    className={`w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/30 ${
                      errors.nilai ? "border-red-300 bg-red-50" : "border-stone-200"
                    }`}
                  />
                  {errors.nilai && <p className="mt-0.5 text-xs text-red-500">{errors.nilai}</p>}
                </div>
                {form.jenis === "BELI_X_GRATIS_Y" && (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-stone-500 mb-1">Beli Minimal (qty) *</label>
                      <input
                        type="number"
                        min="1"
                        value={form.beli_min_qty}
                        onChange={(e) => setForm({ ...form, beli_min_qty: e.target.value })}
                        placeholder="cth. 3"
                        className={`w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/30 ${
                          errors.beli_min_qty ? "border-red-300 bg-red-50" : "border-stone-200"
                        }`}
                      />
                      {errors.beli_min_qty && <p className="mt-0.5 text-xs text-red-500">{errors.beli_min_qty}</p>}
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-stone-500 mb-1">Unit Gratis *</label>
                      <input
                        type="number"
                        min="1"
                        value={form.nilai_gratis}
                        onChange={(e) => setForm({ ...form, nilai_gratis: e.target.value })}
                        placeholder="cth. 1"
                        className={`w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/30 ${
                          errors.nilai_gratis ? "border-red-300 bg-red-50" : "border-stone-200"
                        }`}
                      />
                      {errors.nilai_gratis && <p className="mt-0.5 text-xs text-red-500">{errors.nilai_gratis}</p>}
                    </div>
                  </>
                )}
              </div>

              {/* Berlaku untuk */}
              <div>
                <label className="block text-xs font-medium text-stone-500 mb-1">Berlaku Untuk</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {BERLAKU_OPTIONS.map((b) => (
                    <button
                      key={b.value}
                      type="button"
                      onClick={() => setForm({ ...form, berlaku_untuk: b.value })}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                        form.berlaku_untuk === b.value
                          ? "bg-accent text-white"
                          : "bg-stone-100 text-stone-500 hover:bg-stone-200"
                      }`}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
                {form.berlaku_untuk === "KATEGORI" && (
                  <div className="flex flex-wrap gap-1.5">
                    {allKategori.map((k) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() =>
                          setFormKategori((prev) =>
                            prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]
                          )
                        }
                        className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                          formKategori.includes(k)
                            ? "bg-accent text-white"
                            : "bg-stone-100 text-stone-500 hover:bg-stone-200"
                        }`}
                      >
                        {k}
                      </button>
                    ))}
                    {allKategori.length === 0 && (
                      <span className="text-xs text-stone-400">Belum ada kategori di produk</span>
                    )}
                  </div>
                )}
                {form.berlaku_untuk === "SKU" && (
                  <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                    {products.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() =>
                          setFormProdukIds((prev) =>
                            prev.includes(p.id) ? prev.filter((x) => x !== p.id) : [...prev, p.id]
                          )
                        }
                        className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                          formProdukIds.includes(p.id)
                            ? "bg-accent text-white"
                            : "bg-stone-100 text-stone-500 hover:bg-stone-200"
                        }`}
                      >
                        {p.sku} — {p.nama}
                      </button>
                    ))}
                  </div>
                )}
                {errors.berlaku_untuk && <p className="mt-1 text-xs text-red-500">{errors.berlaku_untuk}</p>}
              </div>

              {/* Min Pembelian */}
              <div>
                <label className="block text-xs font-medium text-stone-500 mb-1">Minimal Pembelian (opsional)</label>
                <input
                  type="number"
                  min="0"
                  value={form.min_pembelian}
                  onChange={(e) => setForm({ ...form, min_pembelian: e.target.value })}
                  placeholder="0 = tanpa minimal"
                  className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/30"
                />
              </div>

              {/* Periode */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-500 mb-1">Tanggal Mulai *</label>
                  <input
                    type="date"
                    value={form.mulai}
                    onChange={(e) => setForm({ ...form, mulai: e.target.value })}
                    className={`w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/30 ${
                      errors.mulai ? "border-red-300 bg-red-50" : "border-stone-200"
                    }`}
                  />
                  {errors.mulai && <p className="mt-0.5 text-xs text-red-500">{errors.mulai}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-500 mb-1">Selesai (opsional)</label>
                  <input
                    type="date"
                    value={form.selesai}
                    onChange={(e) => setForm({ ...form, selesai: e.target.value })}
                    className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/30"
                  />
                </div>
              </div>

              {/* Kuota + Aktif */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-500 mb-1">Kuota (opsional)</label>
                  <input
                    type="number"
                    min="1"
                    value={form.kuota}
                    onChange={(e) => setForm({ ...form, kuota: e.target.value })}
                    placeholder="Kosong = unlimited"
                    className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-500 mb-1">Status</label>
                  <div className="flex gap-2">
                    {[
                      { value: true, label: "Aktif" },
                      { value: false, label: "Nonaktif" },
                    ].map((opt) => (
                      <button
                        key={opt.label}
                        type="button"
                        onClick={() => setForm({ ...form, aktif: opt.value })}
                        className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                          form.aktif === opt.value
                            ? opt.value ? "bg-emerald-500 text-white" : "bg-stone-500 text-white"
                            : "bg-stone-100 text-stone-500 hover:bg-stone-200"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Tombol */}
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-xl px-4 py-2.5 text-sm font-medium text-stone-500 hover:bg-stone-100"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-dark disabled:opacity-60"
              >
                {saving ? "Menyimpan..." : editingId ? "Simpan Perubahan" : "Tambah Diskon"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Konfirmasi Hapus ──────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl text-center">
            <p className="text-stone-700 font-medium">Hapus diskon ini?</p>
            <p className="mt-1 text-sm text-stone-400">Tindakan ini tidak bisa dibatalkan.</p>
            <div className="mt-4 flex justify-center gap-2">
              <button onClick={() => setDeleteTarget(null)} className="rounded-xl px-4 py-2 text-sm font-medium text-stone-500 hover:bg-stone-100">Batal</button>
              <button onClick={handleDelete} className="rounded-xl bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600">Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
