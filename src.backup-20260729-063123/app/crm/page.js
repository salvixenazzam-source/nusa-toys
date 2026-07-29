"use client";

import { useState, useMemo } from "react";
import { useStore } from "@/lib/ProductContext";
import { fmtDate } from "@/lib/helpers";

const fmtRupiah = (n) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

/* ── Komponen Utama ──────────────────────────────────────── */
export default function CrmPage() {
  const { customers, sales, updateCustomer } = useStore();
  const [search, setSearch] = useState("");
  const [editCustomer, setEditCustomer] = useState(null);
  const [editForm, setEditForm] = useState({ noWa: "", instansi: "" });

  /* ─── Perkaya data pelanggan dari sales ─── */
  const enriched = useMemo(() => {
    return customers
      .map((c) => {
        const history = sales.filter(
          (s) => s.pembeli.toLowerCase() === c.nama.toLowerCase()
        );
        const totalBeli = history.reduce((s, x) => s + x.qty, 0);
        const totalBelanja = history.reduce((s, x) => s + x.omzet, 0);
        const produkDibeli = [...new Set(history.map((x) => x.namaProduk))];
        return { ...c, totalBeli, totalBelanja, produkDibeli, history };
      })
      .sort((a, b) => new Date(b.terakhirBeli) - new Date(a.terakhirBeli));
  }, [customers, sales]);

  const filtered = useMemo(() => {
    if (!search.trim()) return enriched;
    const q = search.toLowerCase();
    return enriched.filter((c) => c.nama.toLowerCase().includes(q));
  }, [enriched, search]);

  /* ─── Edit ────────────────────────────── */
  const openEdit = (c) => {
    setEditCustomer(c);
    setEditForm({ noWa: c.noWa || "", instansi: c.instansi || "" });
  };

  const [saving, setSaving] = useState(false);

  const handleSaveEdit = async () => {
    if (!editCustomer) return;
    const waRaw = editForm.noWa.trim();
    const waClean = waRaw.replace(/\D/g, "");
    if (waClean) {
      if (!waClean.startsWith("08")) {
        alert("Nomor WA harus diawali 08.");
        return;
      }
      if (waClean.length < 10 || waClean.length > 13) {
        alert("Nomor WA harus 10–13 digit angka.");
        return;
      }
    }
    setSaving(true);
    await updateCustomer(editCustomer.id, {
      noWa: waRaw,
      instansi: editForm.instansi.trim(),
    });
    setSaving(false);
    setEditCustomer(null);
  };

  /* ─── Render ──────────────────────────── */
  return (
    <div className="px-4 py-6 md:px-10 md:py-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-stone-800">CRM</h1>
        <p className="mt-1 text-sm text-stone-500">
          Data pelanggan, riwayat pembelian, dan informasi kontak.
        </p>
      </div>

      {/* Search */}
      <div className="mt-4 relative max-w-sm">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama pelanggan..."
          className="w-full rounded-xl border border-stone-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-accent/30"
        />
      </div>

      {/* Tabel */}
      <div className="mt-4 overflow-x-auto rounded-2xl border border-stone-200 bg-white">
        <table className="w-full min-w-[800px] text-sm">
          <thead>
            <tr className="border-b border-stone-100 bg-stone-50 text-left text-xs font-medium uppercase tracking-wider text-stone-500">
              <th className="px-4 py-3">Nama</th>
              <th className="px-4 py-3">No WA</th>
              <th className="px-4 py-3">Instansi/Asal</th>
              <th className="px-4 py-3 text-center">Jml Beli</th>
              <th className="px-4 py-3 text-right">Total Belanja</th>
              <th className="px-4 py-3">Terakhir Beli</th>
              <th className="px-4 py-3">Produk</th>
              <th className="px-4 py-3 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-50">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-16 text-center text-stone-400">
                  {customers.length === 0 ? "Belum ada pelanggan." : "Tidak ada pelanggan yang cocok."}
                </td>
              </tr>
            )}
            {filtered.map((c) => {
              const isRepeat = c.history.length > 1;
              return (
                <tr key={c.id} className="hover:bg-stone-50/60">
                  <td className="px-4 py-3">
                    <span className="font-medium text-stone-800">{c.nama}</span>
                    {isRepeat && (
                      <span className="ml-2 inline-flex rounded-full bg-accent-light px-2 py-0.5 text-[10px] font-medium text-accent-dark">
                        Repeat
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-stone-500 font-mono text-xs">
                    {c.noWa ? (
                      <a
                        href={`https://wa.me/${c.noWa.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-600 hover:underline"
                      >
                        {c.noWa}
                      </a>
                    ) : (
                      <span className="text-stone-300 italic">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-stone-600 text-xs">{c.instansi || <span className="text-stone-300 italic">—</span>}</td>
                  <td className="px-4 py-3 text-center font-mono text-stone-700">{c.totalBeli}</td>
                  <td className="px-4 py-3 text-right font-medium text-stone-700">{fmtRupiah(c.totalBelanja)}</td>
                  <td className="px-4 py-3 text-xs text-stone-500">{fmtDate(c.terakhirBeli)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {c.produkDibeli.map((p) => (
                        <span key={p} className="inline-flex rounded-md bg-stone-100 px-1.5 py-0.5 text-[10px] text-stone-500">
                          {p}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => openEdit(c)}
                        className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-800"
                      >
                        Edit
                      </button>
                      {c.noWa && (
                        <a
                          href={`https://wa.me/${c.noWa.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100"
                        >
                          <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                          </svg>
                          WA
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Modal Edit ────────────────────────────────────── */}
      {editCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setEditCustomer(null)} />
          <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-stone-800">
              Edit: {editCustomer.nama}
            </h2>

            <div className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-stone-500 mb-1">Nomor WA</label>
                <input
                  type="text"
                  value={editForm.noWa}
                  onChange={(e) => setEditForm({ ...editForm, noWa: e.target.value })}
                  placeholder="0812xxxx"
                  className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/30"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-500 mb-1">Instansi / Asal</label>
                <input
                  type="text"
                  value={editForm.instansi}
                  onChange={(e) => setEditForm({ ...editForm, instansi: e.target.value })}
                  placeholder="cth. SMAN 3 Jakarta"
                  className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/30"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setEditCustomer(null)}
                className="rounded-xl px-4 py-2.5 text-sm font-medium text-stone-500 transition-colors hover:bg-stone-100"
              >
                Batal
              </button>
              <button
                onClick={handleSaveEdit}
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
