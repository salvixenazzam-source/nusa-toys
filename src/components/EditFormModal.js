"use client";

import { useState, useMemo, useRef } from "react";
import { useStore } from "@/lib/ProductContext";
import { fmtRupiah } from "@/lib/helpers";

const CHANNELS = ["Shopee", "WA", "Sekolah", "Event", "Reseller", "Lainnya"];
const TIPE = ["MASUK", "KELUAR"];

function today() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * EditFormModal — form edit per tipe transaksi.
 * type: 'penjualan' | 'pembelian' | 'persediaan'
 * oldData: data lama yang akan diedit
 * onSave(payload): dipanggil setelah save berhasil
 * onClose: tutup modal
 * toast: callback untuk notifikasi "Transaksi diperbarui"
 */
export default function EditFormModal({ open, type, oldData, onSave, onClose, toast }) {
  const {
    products,
    getHargaByChannel,
    updateSale,
    updatePurchase,
    updatePersediaan,
    sales,
    purchases,
  } = useStore();

  // Init form dari oldData
  const initForm = useMemo(() => {
    if (!oldData) return {};
    if (type === "penjualan") {
      return {
        tanggal: oldData.tanggal || today(),
        pembeli: oldData.pembeli || "",
        channel: oldData.channel || "Shopee",
        sku: oldData.sku || "",
        qty: String(oldData.qty || ""),
        ongkir: String(oldData.ongkir || "0"),
        status: oldData.status || "Lunas",
      };
    }
    if (type === "pembelian") {
      return {
        tanggal: oldData.tanggal || today(),
        supplier: oldData.supplier || "",
        sku: oldData.sku || "",
        qty: String(oldData.qty || ""),
        hargaSatuan: String(oldData.hargaSatuan || ""),
        ongkir: String(oldData.ongkir || "0"),
      };
    }
    if (type === "persediaan") {
      return {
        tanggal: oldData.tanggal || today(),
        tipe: oldData.tipe || "MASUK",
        kategori: oldData.kategori || "",
        jumlah: String(oldData.jumlah || ""),
        qty: String(oldData.qty || ""),
        sku: oldData.sku || "",
        supplier: oldData.supplier || "",
        keterangan: oldData.keterangan || "",
      };
    }
    return {};
  }, [oldData, type]);

  const [form, setForm] = useState(initForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const savingRef = useRef(false);

  // Reset form saat oldData berubah
  const prevOldDataId = useRef(null);
  if (oldData?.id !== prevOldDataId.current) {
    prevOldDataId.current = oldData?.id;
    setForm(initForm);
    setErrors({});
    setSaveError("");
  }

  /* ─── Data turunan (penjualan) ───────── */
  const selectedProduct = useMemo(
    () => products.find((p) => p.sku === form.sku) || null,
    [products, form.sku]
  );

  const hargaJual =
    type === "penjualan" && selectedProduct
      ? getHargaByChannel(selectedProduct, form.channel)
      : 0;

  const qtyNum = Number(form.qty) || 0;
  const omzet = type === "penjualan" ? hargaJual * qtyNum : 0;
  const stokTersedia = selectedProduct ? selectedProduct.stok : 0;
  const laba =
    type === "penjualan" && selectedProduct
      ? omzet - (selectedProduct.hargaModal || 0) * qtyNum
      : 0;

  /* ─── Validasi ───────────────────────── */
  const validate = () => {
    const e = {};
    if (type === "penjualan") {
      if (!form.pembeli.trim()) e.pembeli = "Nama pembeli wajib diisi";
      if (!form.sku) e.sku = "Produk wajib dipilih";
      if (!form.qty || Number(form.qty) <= 0) e.qty = "Qty harus > 0";
      else if (qtyNum > stokTersedia + (oldData?.qty || 0))
        e.qty = `Stok tidak cukup! Tersedia: ${stokTersedia}`;
    }
    if (type === "pembelian") {
      if (!form.sku) e.sku = "Produk wajib dipilih";
      if (!form.qty || Number(form.qty) <= 0) e.qty = "Qty harus > 0";
      if (!form.hargaSatuan || Number(form.hargaSatuan) <= 0)
        e.hargaSatuan = "Harga harus > 0";
    }
    if (type === "persediaan") {
      if (!form.jumlah || Number(form.jumlah) <= 0) e.jumlah = "Jumlah harus > 0";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ─── Simpan ─────────────────────────── */
  const handleSave = async () => {
    if (!validate()) return;
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setSaveError("");

    let ok = false;

    if (type === "penjualan") {
      const saleBaru = {
        ...oldData,
        tanggal: form.tanggal,
        pembeli: form.pembeli.trim(),
        channel: form.channel,
        sku: form.sku,
        namaProduk: selectedProduct?.nama || oldData.namaProduk,
        qty: qtyNum,
        hargaJual,
        ongkir: Number(form.ongkir) || 0,
        omzet,
        laba,
        status: form.status,
        hargaModal: selectedProduct?.hargaModal || oldData.hargaModal || 0,
      };
      ok = await updateSale(oldData.id, saleBaru);
    }

    if (type === "pembelian") {
      const qty = Number(form.qty);
      const hargaSatuan = Number(form.hargaSatuan);
      const ongkir = Number(form.ongkir) || 0;
      const purchaseBaru = {
        ...oldData,
        tanggal: form.tanggal,
        supplier: form.supplier,
        sku: form.sku,
        namaProduk: selectedProduct?.nama || oldData.namaProduk,
        qty,
        hargaSatuan,
        ongkir,
        total: qty * hargaSatuan + ongkir,
      };
      ok = await updatePurchase(oldData.id, purchaseBaru);
    }

    if (type === "persediaan") {
      const itemBaru = {
        tanggal: form.tanggal,
        tipe: form.tipe,
        kategori: form.kategori,
        jumlah: Number(form.jumlah),
        qty: Number(form.qty) || 0,
        sku: form.sku,
        supplier: form.supplier,
        keterangan: form.keterangan,
      };
      ok = await updatePersediaan(oldData.id, itemBaru);
    }

    setSaving(false);
    savingRef.current = false;

    if (!ok) {
      setSaveError("Gagal memperbarui transaksi. Coba lagi.");
      return;
    }

    onSave?.(form);
    toast?.("Transaksi diperbarui");
    onClose();
  };

  /* ─── Handle pilih produk ────────────── */
  const handleSelectProduct = (sku) => {
    const p = products.find((pr) => pr.sku === sku);
    if (p && type === "pembelian") {
      setForm({
        ...form,
        sku,
        supplier: p.supplier || form.supplier,
        hargaSatuan: String(p.hargaModal || ""),
      });
    } else {
      setForm({ ...form, sku });
    }
  };

  /* ─── Total pembelian ────────────────── */
  const totalPembelian =
    (Number(form.qty) || 0) * (Number(form.hargaSatuan) || 0) +
    (Number(form.ongkir) || 0);

  /* ─── Render ─────────────────────────── */
  const title =
    type === "penjualan"
      ? "Edit Penjualan"
      : type === "pembelian"
      ? "Edit Pembelian"
      : "Edit Persediaan";

  if (!open || !oldData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto pt-10 pb-10">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-stone-800">{title}</h2>
        <p className="mt-0.5 text-sm text-stone-400">
          {type === "penjualan" && `Invoice: ${oldData.invoice || "—"}`}
          {type === "pembelian" && "Ubah data pembelian — stok ikut menyesuaikan."}
          {type === "persediaan" && "Ubah entri persediaan."}
        </p>

        <div className="mt-5 space-y-4">
          {/* ═══ PENJUALAN ═══ */}
          {type === "penjualan" && (
            <>
              {/* Pembeli + Tanggal */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-500 mb-1">
                    Pembeli *
                  </label>
                  <input
                    type="text"
                    value={form.pembeli}
                    onChange={(e) =>
                      setForm({ ...form, pembeli: e.target.value })
                    }
                    placeholder="Nama pembeli"
                    className={`w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/30 ${
                      errors.pembeli
                        ? "border-red-300 bg-red-50"
                        : "border-stone-200"
                    }`}
                  />
                  {errors.pembeli && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.pembeli}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-500 mb-1">
                    Tanggal
                  </label>
                  <input
                    type="date"
                    value={form.tanggal}
                    onChange={(e) =>
                      setForm({ ...form, tanggal: e.target.value })
                    }
                    className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/30"
                  />
                </div>
              </div>

              {/* Channel */}
              <div>
                <label className="block text-xs font-medium text-stone-500 mb-1">
                  Channel
                </label>
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
                <label className="block text-xs font-medium text-stone-500 mb-1">
                  Produk *
                </label>
                <select
                  value={form.sku}
                  onChange={(e) =>
                    setForm({ ...form, sku: e.target.value })
                  }
                  className={`w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/30 ${
                    errors.sku
                      ? "border-red-300 bg-red-50"
                      : "border-stone-200"
                  }`}
                >
                  <option value="">-- Pilih Produk --</option>
                  {products
                    .filter((p) => p.status === "Aktif" || p.sku === oldData.sku)
                    .map((p) => (
                      <option key={p.sku} value={p.sku}>
                        {p.sku} — {p.nama} (stok: {p.stok})
                      </option>
                    ))}
                </select>
                {errors.sku && (
                  <p className="mt-1 text-xs text-red-500">{errors.sku}</p>
                )}
              </div>

              {/* Qty + Ongkir */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-500 mb-1">
                    Qty *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={form.qty}
                    onChange={(e) =>
                      setForm({ ...form, qty: e.target.value })
                    }
                    className={`w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/30 ${
                      errors.qty
                        ? "border-red-300 bg-red-50"
                        : "border-stone-200"
                    }`}
                  />
                  {errors.qty && (
                    <p className="mt-0.5 text-[10px] text-red-500">
                      {errors.qty}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-500 mb-1">
                    Ongkir
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.ongkir}
                    onChange={(e) =>
                      setForm({ ...form, ongkir: e.target.value })
                    }
                    className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/30"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-medium text-stone-500 mb-1">
                  Status
                </label>
                <div className="flex gap-2">
                  {["Lunas", "Pending"].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setForm({ ...form, status: s })}
                      className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                        form.status === s
                          ? s === "Lunas"
                            ? "bg-emerald-500 text-white"
                            : "bg-amber-500 text-white"
                          : "bg-stone-100 text-stone-500 hover:bg-stone-200"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ringkasan */}
              {selectedProduct && qtyNum > 0 && (
                <div className="rounded-xl bg-stone-50 p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-stone-500">
                      Harga {form.channel}
                    </span>
                    <span className="font-medium text-stone-700">
                      {fmtRupiah(hargaJual)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">
                      Omzet ({qtyNum} × {fmtRupiah(hargaJual)})
                    </span>
                    <span className="font-semibold text-stone-800">
                      {fmtRupiah(omzet)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-stone-200 pt-2">
                    <span className="text-stone-500">Estimasi Laba</span>
                    <span className="font-semibold text-emerald-600">
                      {fmtRupiah(laba)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-stone-400">Stok tersedia</span>
                    <span
                      className={`font-mono ${
                        stokTersedia <= 0
                          ? "text-red-500"
                          : "text-stone-500"
                      }`}
                    >
                      {stokTersedia}
                    </span>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ═══ PEMBELIAN ═══ */}
          {type === "pembelian" && (
            <>
              {/* Produk */}
              <div>
                <label className="block text-xs font-medium text-stone-500 mb-1">
                  Produk *
                </label>
                <select
                  value={form.sku}
                  onChange={(e) => handleSelectProduct(e.target.value)}
                  className={`w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/30 ${
                    errors.sku
                      ? "border-red-300 bg-red-50"
                      : "border-stone-200"
                  }`}
                >
                  <option value="">-- Pilih Produk --</option>
                  {products
                    .filter((p) => p.status === "Aktif" || p.sku === oldData.sku)
                    .map((p) => (
                      <option key={p.sku} value={p.sku}>
                        {p.sku} — {p.nama}
                      </option>
                    ))}
                </select>
                {errors.sku && (
                  <p className="mt-1 text-xs text-red-500">{errors.sku}</p>
                )}
              </div>

              {/* Tanggal */}
              <div>
                <label className="block text-xs font-medium text-stone-500 mb-1">
                  Tanggal
                </label>
                <input
                  type="date"
                  value={form.tanggal}
                  onChange={(e) =>
                    setForm({ ...form, tanggal: e.target.value })
                  }
                  className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/30"
                />
              </div>

              {/* Supplier */}
              <div>
                <label className="block text-xs font-medium text-stone-500 mb-1">
                  Supplier
                </label>
                <input
                  type="text"
                  value={form.supplier}
                  onChange={(e) =>
                    setForm({ ...form, supplier: e.target.value })
                  }
                  placeholder="Nama supplier"
                  className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/30"
                />
              </div>

              {/* Qty + Harga */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-500 mb-1">
                    Qty *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={form.qty}
                    onChange={(e) =>
                      setForm({ ...form, qty: e.target.value })
                    }
                    className={`w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/30 ${
                      errors.qty
                        ? "border-red-300 bg-red-50"
                        : "border-stone-200"
                    }`}
                  />
                  {errors.qty && (
                    <p className="mt-0.5 text-[10px] text-red-500">
                      {errors.qty}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-500 mb-1">
                    Harga Satuan *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.hargaSatuan}
                    onChange={(e) =>
                      setForm({ ...form, hargaSatuan: e.target.value })
                    }
                    className={`w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/30 ${
                      errors.hargaSatuan
                        ? "border-red-300 bg-red-50"
                        : "border-stone-200"
                    }`}
                  />
                  {errors.hargaSatuan && (
                    <p className="mt-0.5 text-[10px] text-red-500">
                      {errors.hargaSatuan}
                    </p>
                  )}
                </div>
              </div>

              {/* Ongkir */}
              <div>
                <label className="block text-xs font-medium text-stone-500 mb-1">
                  Ongkir
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.ongkir}
                  onChange={(e) =>
                    setForm({ ...form, ongkir: e.target.value })
                  }
                  className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/30"
                />
              </div>

              {/* Total */}
              <div className="rounded-xl bg-accent-light px-4 py-3">
                <span className="text-xs font-medium text-accent-dark">Total</span>
                <p className="text-lg font-semibold text-accent-dark">
                  {fmtRupiah(totalPembelian)}
                </p>
              </div>
            </>
          )}

          {/* ═══ PERSEDIAAN ═══ */}
          {type === "persediaan" && (
            <>
              {/* Tanggal */}
              <div>
                <label className="block text-xs font-medium text-stone-500 mb-1">
                  Tanggal
                </label>
                <input
                  type="date"
                  value={form.tanggal}
                  onChange={(e) =>
                    setForm({ ...form, tanggal: e.target.value })
                  }
                  className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/30"
                />
              </div>

              {/* Tipe */}
              <div>
                <label className="block text-xs font-medium text-stone-500 mb-1">
                  Tipe
                </label>
                <div className="flex gap-2">
                  {TIPE.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setForm({ ...form, tipe: t })}
                      className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                        form.tipe === t
                          ? t === "MASUK"
                            ? "bg-emerald-500 text-white"
                            : "bg-red-500 text-white"
                          : "bg-stone-100 text-stone-500 hover:bg-stone-200"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Kategori */}
              <div>
                <label className="block text-xs font-medium text-stone-500 mb-1">
                  Kategori
                </label>
                <input
                  type="text"
                  value={form.kategori}
                  onChange={(e) =>
                    setForm({ ...form, kategori: e.target.value })
                  }
                  className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/30"
                />
              </div>

              {/* Jumlah */}
              <div>
                <label className="block text-xs font-medium text-stone-500 mb-1">
                  Jumlah *
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.jumlah}
                  onChange={(e) =>
                    setForm({ ...form, jumlah: e.target.value })
                  }
                  className={`w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/30 ${
                    errors.jumlah
                      ? "border-red-300 bg-red-50"
                      : "border-stone-200"
                  }`}
                />
                {errors.jumlah && (
                  <p className="mt-0.5 text-xs text-red-500">{errors.jumlah}</p>
                )}
              </div>

              {/* Qty + SKU */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-500 mb-1">
                    Qty
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.qty}
                    onChange={(e) =>
                      setForm({ ...form, qty: e.target.value })
                    }
                    className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-500 mb-1">
                    SKU
                  </label>
                  <input
                    type="text"
                    value={form.sku}
                    onChange={(e) =>
                      setForm({ ...form, sku: e.target.value })
                    }
                    className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/30"
                  />
                </div>
              </div>

              {/* Supplier */}
              <div>
                <label className="block text-xs font-medium text-stone-500 mb-1">
                  Supplier
                </label>
                <input
                  type="text"
                  value={form.supplier}
                  onChange={(e) =>
                    setForm({ ...form, supplier: e.target.value })
                  }
                  className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/30"
                />
              </div>

              {/* Keterangan */}
              <div>
                <label className="block text-xs font-medium text-stone-500 mb-1">
                  Keterangan
                </label>
                <input
                  type="text"
                  value={form.keterangan}
                  onChange={(e) =>
                    setForm({ ...form, keterangan: e.target.value })
                  }
                  className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/30"
                />
              </div>
            </>
          )}
        </div>

        {/* Save error */}
        {saveError && (
          <div className="mt-4 rounded-xl bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-600">
            {saveError}
          </div>
        )}

        {/* Tombol */}
        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-2.5 text-sm font-medium text-stone-500 transition-colors hover:bg-stone-100"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-dark disabled:opacity-60"
          >
            {saving ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </div>
      </div>
    </div>
  );
}
