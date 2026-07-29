"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useStore } from "@/lib/ProductContext";
import { fmtDate, fmtRupiah } from "@/lib/helpers";

/* ── Helpers ─────────────────────────────────────────────── */
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

/* ── Komponen Utama ──────────────────────────────────────── */
export default function JurnalPage() {
  const { fetchJurnalList } = useStore();

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

  /* ─── State ──────────────────────────── */
  const [jurnalList, setJurnalList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedJurnal, setSelectedJurnal] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchJurnalList(dateFrom, dateTo);
      setJurnalList(data || []);
    } catch (err) {
      setError(err.message || "Gagal memuat jurnal");
      console.error("Jurnal error:", err);
    }
    setLoading(false);
  }, [fetchJurnalList, dateFrom, dateTo]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* ─── Hitung total per jurnal ────────── */
  const jurnalWithTotals = useMemo(() => {
    return jurnalList.map((j) => {
      const items = j.jurnal_item || [];
      const totalDebit = items.reduce((s, i) => s + (Number(i.debit) || 0), 0);
      const totalKredit = items.reduce((s, i) => s + (Number(i.kredit) || 0), 0);
      const balanced = totalDebit === totalKredit && totalDebit > 0;
      const akunNames = items
        .map((i) => i.akun?.nama || `Akun #${i.akun_id}`)
        .filter((v, idx, arr) => arr.indexOf(v) === idx) // unique
        .join(", ");
      return { ...j, totalDebit, totalKredit, balanced, akunNames };
    });
  }, [jurnalList]);

  /* ─── Detail modal ────────────────────── */
  const openDetail = (jurnal) => {
    setSelectedJurnal(jurnal);
    setDetailOpen(true);
  };

  const closeDetail = () => {
    setDetailOpen(false);
    setSelectedJurnal(null);
  };

  /* ─── Render ──────────────────────────── */
  return (
    <div className="px-4 py-6 md:px-10 md:py-10">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-stone-800">
            Jurnal
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            Daftar semua entri jurnal double-entry.
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
            {jurnalWithTotals.length} jurnal
          </span>
        </div>
      </div>

      {/* ── Loading / Error ─────────────────────────────────── */}
      {loading && (
        <div className="mt-8 flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-200 border-t-accent" />
          <span className="ml-3 text-sm text-stone-400">Memuat jurnal...</span>
        </div>
      )}

      {error && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
          <button
            onClick={loadData}
            className="ml-4 underline hover:text-red-800"
          >
            Coba lagi
          </button>
        </div>
      )}

      {/* ── Tabel Jurnal ────────────────────────────────────── */}
      {!loading && !error && (
        <div className="mt-6">
          {jurnalWithTotals.length === 0 ? (
            <div className="rounded-2xl border border-stone-200 bg-white p-16 text-center">
              <p className="text-stone-400">Belum ada jurnal di periode ini.</p>
              <p className="text-xs text-stone-300 mt-1">
                Jurnal akan muncul otomatis saat ada transaksi penjualan, pembelian, atau biaya.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50">
                    <Th>Tanggal</Th>
                    <Th>Keterangan</Th>
                    <Th>Ref</Th>
                    <Th className="text-right">Debit</Th>
                    <Th className="text-right">Kredit</Th>
                    <Th>Akun</Th>
                    <Th className="text-center">Balance</Th>
                  </tr>
                </thead>
                <tbody>
                  {jurnalWithTotals.map((j) => (
                    <tr
                      key={j.id}
                      onClick={() => openDetail(j)}
                      className="border-b border-stone-100 hover:bg-stone-50 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-stone-600 whitespace-nowrap">
                        {fmtDate(j.tanggal)}
                      </td>
                      <td className="px-4 py-3 text-stone-700 max-w-xs truncate">
                        {j.keterangan}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-block rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-500">
                          {j.ref_type || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-right text-stone-700">
                        {fmtRupiah(j.totalDebit)}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-right text-stone-700">
                        {fmtRupiah(j.totalKredit)}
                      </td>
                      <td className="px-4 py-3 text-xs text-stone-500 max-w-[200px] truncate">
                        {j.akunNames}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {j.balanced ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-600">
                            ✓
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
                            ✗
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Detail Modal ────────────────────────────────────── */}
      {detailOpen && selectedJurnal && (
        <JurnalDetailModal jurnal={selectedJurnal} onClose={closeDetail} />
      )}
    </div>
  );
}

/* ── Table Header ─────────────────────────────────────────── */
function Th({ children, className = "" }) {
  return (
    <th
      className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-400 ${className}`}
    >
      <div className="flex flex-col">{children}</div>
    </th>
  );
}

/* ── Detail Modal ─────────────────────────────────────────── */
function JurnalDetailModal({ jurnal, onClose }) {
  const items = jurnal.jurnal_item || [];
  const totalDebit = items.reduce((s, i) => s + (Number(i.debit) || 0), 0);
  const totalKredit = items.reduce((s, i) => s + (Number(i.kredit) || 0), 0);
  const balanced = totalDebit === totalKredit && totalDebit > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 mx-4 w-full max-w-lg rounded-2xl border border-stone-200 bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 px-6 py-4">
          <div>
            <h3 className="text-lg font-semibold text-stone-800">
              Detail Jurnal
            </h3>
            <p className="text-xs text-stone-400 mt-0.5">
              {fmtDate(jurnal.tanggal)} &middot; {jurnal.ref_type || "Manual"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Keterangan */}
        <div className="px-6 py-4 border-b border-stone-100">
          <p className="text-sm font-medium text-stone-700">{jurnal.keterangan}</p>
        </div>

        {/* Tabel Item */}
        <div className="px-6 py-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100">
                <th className="pb-2 text-left text-xs font-semibold uppercase tracking-wider text-stone-400">
                  <div className="flex flex-col">Akun</div>
                </th>
                <th className="pb-2 text-right text-xs font-semibold uppercase tracking-wider text-stone-400">
                  <div className="flex flex-col">Debit</div>
                </th>
                <th className="pb-2 text-right text-xs font-semibold uppercase tracking-wider text-stone-400">
                  <div className="flex flex-col">Kredit</div>
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-stone-50">
                  <td className="py-2.5 pr-3">
                    <span className="text-stone-700">
                      {item.akun?.nama || `Akun #${item.akun_id}`}
                    </span>
                    {item.akun?.kode && (
                      <span className="ml-1.5 text-xs text-stone-400 font-mono">
                        {item.akun.kode}
                      </span>
                    )}
                    {item.keterangan && (
                      <p className="text-xs text-stone-400 mt-0.5">{item.keterangan}</p>
                    )}
                  </td>
                  <td className="py-2.5 text-right font-mono text-xs text-stone-700">
                    {Number(item.debit) > 0 ? fmtRupiah(item.debit) : "—"}
                  </td>
                  <td className="py-2.5 text-right font-mono text-xs text-stone-700">
                    {Number(item.kredit) > 0 ? fmtRupiah(item.kredit) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-stone-200">
                <td className="pt-3 text-sm font-semibold text-stone-700">Total</td>
                <td className="pt-3 text-right font-mono text-sm font-semibold text-stone-700">
                  {fmtRupiah(totalDebit)}
                </td>
                <td className="pt-3 text-right font-mono text-sm font-semibold text-stone-700">
                  {fmtRupiah(totalKredit)}
                </td>
              </tr>
            </tfoot>
          </table>

          {/* Balance indicator */}
          <div
            className={`mt-4 flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium ${
              balanced
                ? "bg-emerald-50 text-emerald-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {balanced ? (
              <>
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                BALANCE — Total Debit = Total Kredit
              </>
            ) : (
              <>
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                TIDAK BALANCE — Debit {fmtRupiah(totalDebit)} ≠ Kredit {fmtRupiah(totalKredit)}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
