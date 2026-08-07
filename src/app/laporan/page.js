"use client";

import { useState, useEffect, useMemo, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useStore } from "@/lib/ProductContext";
import { fmtDate } from "@/lib/helpers";
import PinModal from "@/components/PinModal";
import EditFormModal from "@/components/EditFormModal";

/* ── Helpers ─────────────────────────────────────────────── */
const fmtRupiah = (n) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);

const today = () => new Date().toISOString().slice(0, 10);

function startOfMonth(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

function daysAgo(d, n) {
  const t = new Date(d);
  t.setDate(t.getDate() - n);
  return t.toISOString().slice(0, 10);
}

function startOfYear(d) {
  return `${d.getFullYear()}-01-01`;
}

/* ── Hitung saldo akun berdasarkan saldo_normal ──────────── */
function saldoAkun(akun) {
  if (akun.saldo_normal === "Debit") {
    return akun.total_debit - akun.total_kredit;
  }
  // Kredit
  return akun.total_kredit - akun.total_debit;
}

/* ── Komponen Utama (inner, setelah Suspense) ────────────── */
function LaporanInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { fetchPnL, fetchNeraca, fetchPersediaanSummary, keuangan, sales, persediaan, addKeuangan, triggerJurnalKeuangan, updateSale, updatePurchase, updatePersediaan, purchases } = useStore();

  const activeTab = searchParams.get("tab") || "pnl";

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

  /* ─── State data ─────────────────────── */
  const [pnlData, setPnlData] = useState([]);
  const [neracaData, setNeracaData] = useState([]);
  const [persediaanSummary, setPersediaanSummary] = useState({ totalDibeli: 0, totalTerjual: 0, sisa: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [pnl, neraca, persediaanSum] = await Promise.all([
        fetchPnL(dateFrom, dateTo),
        fetchNeraca(dateFrom, dateTo),
        fetchPersediaanSummary(dateFrom, dateTo),
      ]);
      setPnlData(pnl || []);
      setNeracaData(neraca || []);
      setPersediaanSummary(persediaanSum || { totalDibeli: 0, totalTerjual: 0, sisa: 0 });
    } catch (err) {
      setError(err.message || "Gagal memuat data laporan");
      console.error("Laporan error:", err);
    }
    setLoading(false);
  }, [fetchPnL, fetchNeraca, fetchPersediaanSummary, dateFrom, dateTo]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* ─── Kalkulasi P&L ──────────────────── */
  const pnl = useMemo(() => {
    const pendapatan = [];
    const beban = [];
    let totalPendapatan = 0;
    let totalBeban = 0;

    for (const akun of pnlData) {
      const saldo = saldoAkun(akun);
      if (akun.tipe === "Pendapatan") {
        pendapatan.push({ ...akun, saldo });
        totalPendapatan += saldo;
      } else if (akun.tipe === "Beban") {
        beban.push({ ...akun, saldo });
        totalBeban += saldo;
      }
    }

    // Urutkan beban per kode
    beban.sort((a, b) => a.kode.localeCompare(b.kode));

    const labaBersih = totalPendapatan - totalBeban;
    return { pendapatan, beban, totalPendapatan, totalBeban, labaBersih };
  }, [pnlData]);

  /* ─── Kalkulasi Neraca ───────────────── */
  const neraca = useMemo(() => {
    const aset = [];
    const kewajiban = [];
    const modal = [];
    let totalAset = 0;
    let totalKewajiban = 0;

    for (const akun of neracaData) {
      const saldo = saldoAkun(akun);
      if (akun.tipe === "Aset") {
        aset.push({ ...akun, saldo });
        totalAset += saldo;
      } else if (akun.tipe === "Kewajiban") {
        kewajiban.push({ ...akun, saldo });
        totalKewajiban += saldo;
      } else if (akun.tipe === "Modal") {
        modal.push({ ...akun, saldo });
      }
    }

    // Pisahkan Modal Pemilik (3100) dan Prive (3200)
    const modalPemilik = modal.find((m) => m.kode === "3100");
    const prive = modal.find((m) => m.kode === "3200");
    const modalLain = modal.filter((m) => m.kode !== "3100" && m.kode !== "3200");

    const modalPemilikSaldo = modalPemilik?.saldo || 0;
    const priveSaldo = prive?.saldo || 0;
    const modalLainSaldo = modalLain.reduce((s, m) => s + m.saldo, 0);

    const labaDitahan = pnl.labaBersih;
    const totalModal = modalPemilikSaldo - priveSaldo + modalLainSaldo + labaDitahan;
    const totalKewajibanModal = totalKewajiban + totalModal;
    const balanced = Math.abs(totalAset - totalKewajibanModal) < 1; // toleransi 1 rupiah

    return {
      aset,
      kewajiban,
      modalPemilik: modalPemilikSaldo,
      prive: priveSaldo,
      modalLain: modalLainSaldo,
      labaDitahan,
      totalAset,
      totalKewajiban,
      totalModal,
      totalKewajibanModal,
      balanced,
    };
  }, [neracaData, pnl.labaBersih]);

  /* ─── Tab switching ───────────────────── */
  const switchTab = (tab) => {
    router.push(`/laporan?tab=${tab}`, { scroll: false });
  };

  /* ─── Render ──────────────────────────── */
  return (
    <div className="px-4 py-6 md:px-10 md:py-10">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-stone-800">
            Laporan Keuangan
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            Double-entry accounting — ringkasan performa bisnis.
          </p>
        </div>
      </div>

      {/* ── Tab Bar ─────────────────────────────────────────── */}
      <div className="mt-6 flex gap-1 rounded-xl bg-stone-100 p-1 w-fit">
        <button
          onClick={() => switchTab("cashflow")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "cashflow"
              ? "bg-white text-stone-800 shadow-sm"
              : "text-stone-500 hover:text-stone-700"
          }`}
        >
          C A S H F L O W
        </button>
        <button
          onClick={() => switchTab("pnl")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "pnl"
              ? "bg-white text-stone-800 shadow-sm"
              : "text-stone-500 hover:text-stone-700"
          }`}
        >
          L A B A   R U G I
        </button>
        <button
          onClick={() => switchTab("neraca")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "neraca"
              ? "bg-white text-stone-800 shadow-sm"
              : "text-stone-500 hover:text-stone-700"
          }`}
        >
          N E R A C A
        </button>
      </div>

      {/* ── Filter Periode ────────────────────────────────────── */}
      <div className="mt-4 rounded-2xl border border-stone-200 bg-white p-5">
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
          </div>
        </div>

      {/* ── Loading / Error ─────────────────────────────────── */}
      {loading && (
        <div className="mt-8 flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-200 border-t-accent" />
          <span className="ml-3 text-sm text-stone-400">Memuat laporan...</span>
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

      {/* ── Cashflow Tab ──────────────────────────────────────── */}
      {!loading && !error && activeTab === "cashflow" && (
        <CashflowView
          keuangan={keuangan}
          sales={sales}
          persediaan={persediaan}
          persediaanSummary={persediaanSummary}
          addKeuangan={addKeuangan}
          triggerJurnalKeuangan={triggerJurnalKeuangan}
          updateSale={updateSale}
          updatePersediaan={updatePersediaan}
          purchases={purchases}
          dateFrom={dateFrom}
          dateTo={dateTo}
        />
      )}

      {/* ── P&L Tab ─────────────────────────────────────────── */}
      {!loading && !error && activeTab === "pnl" && (
        <PnLView pnl={pnl} dateFrom={dateFrom} dateTo={dateTo} />
      )}

      {/* ── Neraca Tab ──────────────────────────────────────── */}
      {!loading && !error && activeTab === "neraca" && (
        <NeracaView neraca={neraca} dateFrom={dateFrom} dateTo={dateTo} />
      )}
    </div>
  );
}

/* ── Sub-Komponen: P&L View ────────────────────────────────── */
function PnLView({ pnl, dateFrom, dateTo }) {
  return (
    <div className="mt-6 max-w-2xl">
      <div className="rounded-2xl border border-stone-200 bg-white">
        {/* Title */}
        <div className="border-b border-stone-100 px-6 py-5 text-center">
          <h2 className="text-lg font-bold tracking-[0.3em] text-stone-700 uppercase">
            L A B A &nbsp; R U G I
          </h2>
          <p className="mt-1 text-xs text-stone-400">
            Periode: {fmtDate(dateFrom)} — {fmtDate(dateTo)}
          </p>
        </div>

        <div className="px-6 py-5 space-y-3 text-sm">
          {/* PENDAPATAN */}
          <SectionLabel label="PENDAPATAN" />
          {pnl.pendapatan.length === 0 ? (
            <EmptyRow label="Tidak ada pendapatan" />
          ) : (
            pnl.pendapatan.map((a) => (
              <LineItem key={a.akun_id} label={a.nama} value={a.saldo} positive />
            ))
          )}
          <LineItem
            label="Total Pendapatan"
            value={pnl.totalPendapatan}
            bold
            borderTop
            positive
          />

          {/* BEBAN */}
          <SectionLabel label="BEBAN" className="pt-2" />
          {pnl.beban.length === 0 ? (
            <EmptyRow label="Tidak ada beban" />
          ) : (
            pnl.beban.map((a) => (
              <LineItem key={a.akun_id} label={a.nama} value={a.saldo} negative />
            ))
          )}
          <LineItem
            label="Total Beban"
            value={pnl.totalBeban}
            bold
            borderTop
            negative
          />

          {/* LABA BERSIH */}
          <div className="pt-3">
            <div
              className={`flex justify-between rounded-xl px-4 py-3 ${
                pnl.labaBersih >= 0
                  ? "bg-emerald-50"
                  : "bg-red-50"
              }`}
            >
              <span className="text-base font-bold text-stone-800">
                LABA BERSIH
              </span>
              <span
                className={`text-base font-mono font-bold ${
                  pnl.labaBersih >= 0
                    ? "text-emerald-700"
                    : "text-red-700"
                }`}
              >
                {fmtRupiah(pnl.labaBersih)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Ringkasan cards */}
      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
        <SummaryCard
          label="Total Pendapatan"
          value={pnl.totalPendapatan}
          color="emerald"
        />
        <SummaryCard
          label="Total Beban"
          value={pnl.totalBeban}
          color="red"
        />
        <SummaryCard
          label="Laba Bersih"
          value={pnl.labaBersih}
          color={pnl.labaBersih >= 0 ? "teal" : "red"}
          fullWidth
        />
      </div>
    </div>
  );
}

/* ── Sub-Komponen: Neraca View ─────────────────────────────── */
function NeracaView({ neraca, dateFrom, dateTo }) {
  return (
    <div className="mt-6 max-w-2xl">
      <div className="rounded-2xl border border-stone-200 bg-white">
        {/* Title */}
        <div className="border-b border-stone-100 px-6 py-5 text-center">
          <h2 className="text-lg font-bold tracking-[0.3em] text-stone-700 uppercase">
            N E R A C A
          </h2>
          <p className="mt-1 text-xs text-stone-400">
            Per {fmtDate(dateTo)} &nbsp;·&nbsp; Periode: {fmtDate(dateFrom)} — {fmtDate(dateTo)}
          </p>
        </div>

        <div className="px-6 py-5 space-y-3 text-sm">
          {/* ASET */}
          <SectionLabel label="ASET" />
          {neraca.aset.length === 0 ? (
            <EmptyRow label="Tidak ada aset" />
          ) : (
            neraca.aset.map((a) => (
              <LineItem key={a.akun_id} label={a.nama} value={a.saldo} positive />
            ))
          )}
          <LineItem
            label="Total Aset"
            value={neraca.totalAset}
            bold
            borderTop
            positive
          />

          {/* KEWAJIBAN */}
          <SectionLabel label="KEWAJIBAN" className="pt-2" />
          {neraca.kewajiban.length === 0 ? (
            <EmptyRow label="Tidak ada kewajiban" />
          ) : (
            neraca.kewajiban.map((a) => (
              <LineItem key={a.akun_id} label={a.nama} value={a.saldo} positive />
            ))
          )}
          <LineItem
            label="Total Kewajiban"
            value={neraca.totalKewajiban}
            bold
            borderTop
            positive
          />

          {/* MODAL */}
          <SectionLabel label="MODAL" className="pt-2" />
          <LineItem label="Modal Pemilik" value={neraca.modalPemilik} positive />
          <LineItem label="Prive" value={neraca.prive} negative />
          <LineItem
            label={neraca.labaDitahan >= 0 ? "Laba Periode Berjalan" : "Rugi Periode Berjalan"}
            value={neraca.labaDitahan}
            positive={neraca.labaDitahan >= 0}
            note="(dari Laporan Laba Rugi)"
          />
          <LineItem
            label="Total Modal"
            value={neraca.totalModal}
            bold
            borderTop
            positive
          />

          {/* TOTAL KEWAJIBAN + MODAL */}
          <LineItem
            label="TOTAL KEWAJIBAN + MODAL"
            value={neraca.totalKewajibanModal}
            bold
            borderTop
            borderDouble
            positive
          />

          {/* Balance Check */}
          <div
            className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 mt-3 text-sm font-medium ${
              neraca.balanced
                ? "bg-emerald-50 text-emerald-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {neraca.balanced ? (
              <>
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                BALANCE — Total Aset = Total Kewajiban + Modal
              </>
            ) : (
              <>
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                TIDAK BALANCE — Selisih {fmtRupiah(Math.abs(neraca.totalAset - neraca.totalKewajibanModal))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Sub-Komponen: Cashflow View ────────────────────────────── */

const TIPE = ["Pemasukan", "Pengeluaran"];
const KATEGORI_PENGELUARAN = ["Operasional", "Gaji", "Pajak", "Beli Stok", "HPP", "Lainnya"];
const FILTER_TABS = ["Semua", "Penjualan", "Operasional"];

const SOURCE_COLORS = {
  Penjualan: "bg-blue-50 text-blue-700",
  Pembelian: "bg-purple-50 text-purple-700",
  Manual: "bg-stone-100 text-stone-500",
};

const EMPTY_FORM = {
  tanggal: today(),
  tipe: "Pengeluaran",
  kategori: "Operasional",
  jumlah: "",
  keterangan: "",
};

function CashflowView({ keuangan, sales, persediaan, persediaanSummary, addKeuangan, triggerJurnalKeuangan, updateSale, updatePersediaan, purchases, dateFrom, dateTo }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [filterTab, setFilterTab] = useState("Semua");
  const [saving, setSaving] = useState(false);

  /* ─── Edit state ─────────────────────── */
  const [pinModal, setPinModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [editType, setEditType] = useState("penjualan");
  const [toast, setToast] = useState("");

  const handleEditClick = (t) => {
    if (t.sumber === "Penjualan") {
      // id format: "sale-<id>"
      const saleId = t.id.replace("sale-", "");
      const sale = sales.find((s) => String(s.id) === String(saleId));
      if (sale) {
        setEditItem(sale);
        setEditType("penjualan");
      } else {
        setToast("Data transaksi sumber tidak ditemukan");
        return;
      }
    } else {
      // Manual — tidak diedit
      return;
    }
    setPinModal(true);
  };

  const handleEditPersediaan = (p) => {
    setEditItem(p);
    setEditType("persediaan");
    setPinModal(true);
  };

  const handlePinSuccess = () => {
    setPinModal(false);
    setEditModal(true);
  };

  const handleEditClose = () => {
    setEditModal(false);
    setEditItem(null);
  };

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

    // Manual (skip auto-generated dari penjualan & pembelian stok legacy)
    keuangan.forEach((k) => {
      if (k.kategori === "Penjualan" || k.kategori === "Pembelian Stok") return;
      items.push({ ...k, sumber: "Manual", id: `manual-${k.id}` });
    });

    return items.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
  }, [sales, keuangan]);

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
    setFormErrors({});
    setModalOpen(true);
  };

  /* ─── Validasi ──────────────────────── */
  const validate = () => {
    const e = {};
    if (!form.jumlah || Number(form.jumlah) <= 0) e.jumlah = "Jumlah harus > 0";
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ─── Simpan ────────────────────────── */
  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    const savedItem = await addKeuangan({
      tanggal: form.tanggal,
      tipe: form.tipe,
      kategori: form.kategori,
      jumlah: Number(form.jumlah),
      keterangan: form.keterangan.trim().replace(/<[^>]*>/g, ""),
    });
    if (!savedItem) {
      setSaving(false);
      return;
    }

    // Catat jurnal double-entry otomatis
    try {
      await triggerJurnalKeuangan(savedItem);
    } catch (jurnalErr) {
      console.warn("Peringatan: gagal catat jurnal:", jurnalErr);
    }

    setSaving(false);
    setModalOpen(false);
  };

  return (
    <div className="mt-6">
      {/* Header + Button */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-stone-800">Arus Kas</h2>
          <p className="text-xs text-stone-400">
            {fmtDate(dateFrom)} — {fmtDate(dateTo)}
          </p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-dark self-start sm:self-auto"
        >
          <span className="text-base">+</span> Catat Transaksi
        </button>
      </div>

      {/* ── Ringkasan Cards ───────────────── */}

      {/* ── Investasi Persediaan ──────────────────────────── */}
      <div className="mt-4 rounded-2xl bg-amber-50 p-5 border border-amber-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-amber-600">Investasi Persediaan</p>
            <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm">
              <div>
                <span className="text-amber-500">Total Dibeli:</span>{" "}
                <span className="font-mono font-semibold text-amber-700">{fmtRupiah(persediaanSummary.totalDibeli)}</span>
              </div>
              <div>
                <span className="text-amber-500">Terjual (HPP):</span>{" "}
                <span className="font-mono font-semibold text-amber-700">{fmtRupiah(persediaanSummary.totalTerjual)}</span>
              </div>
              <div>
                <span className="text-amber-500">Sisa Persediaan:</span>{" "}
                <span className="font-mono font-bold text-amber-800">{fmtRupiah(persediaanSummary.sisa)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-emerald-50 p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-emerald-600">Pemasukan</p>
          <p className="mt-1 text-xl font-semibold text-emerald-700">{fmtRupiah(summary.pemasukan)}</p>
        </div>
        <div className="rounded-2xl bg-red-50 p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-red-500">Pengeluaran</p>
          <p className="mt-1 text-xl font-semibold text-red-600">{fmtRupiah(summary.pengeluaran)}</p>
        </div>
        <div className={`rounded-2xl p-5 ${summary.laba >= 0 ? "bg-accent-light" : "bg-red-50"}`}>
          <p className="text-xs font-medium uppercase tracking-wider text-accent-dark">Saldo Bersih</p>
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
              <th className="px-4 py-3 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-50">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-16 text-center text-stone-400">
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
                  {t.tipe === "Pemasukan" ? "+" : "\u2212"} {fmtRupiah(t.jumlah)}
                </td>
                <td className="px-4 py-3 text-stone-500 text-xs max-w-[220px] truncate">
                  {t.keterangan || "\u2014"}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${SOURCE_COLORS[t.sumber] || "bg-stone-100 text-stone-500"}`}>
                    {t.sumber}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  {t.sumber === "Penjualan" ? (
                    <button
                      onClick={() => handleEditClick(t)}
                      className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-stone-500 hover:bg-accent-light hover:text-accent-dark transition-colors"
                      title="Edit penjualan"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                      </svg>
                      Edit
                    </button>
                  ) : (
                    <span className="text-[10px] text-stone-300">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Tabel Persediaan ──────────────────────────────── */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-stone-800 mb-3">Data Persediaan</h2>
        <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white">
          <table className="w-full min-w-[700px] text-sm">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50 text-left text-xs font-medium uppercase tracking-wider text-stone-500">
                <th className="px-4 py-3">Tanggal</th>
                <th className="px-4 py-3">Tipe</th>
                <th className="px-4 py-3">Kategori</th>
                <th className="px-4 py-3 text-right">Jumlah</th>
                <th className="px-4 py-3 text-center">Qty</th>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Supplier</th>
                <th className="px-4 py-3">Keterangan</th>
                <th className="px-4 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {persediaan.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center text-stone-400">
                    Belum ada data persediaan.
                  </td>
                </tr>
              )}
              {persediaan.map((p) => (
                <tr key={p.id} className="hover:bg-stone-50/60">
                  <td className="px-4 py-3 text-stone-500 text-xs whitespace-nowrap">
                    {fmtDate(p.tanggal)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      p.tipe === "MASUK" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
                    }`}>
                      {p.tipe}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-stone-600 text-xs">{p.kategori}</td>
                  <td className="px-4 py-3 text-right font-mono font-medium whitespace-nowrap text-stone-700">
                    {fmtRupiah(Number(p.jumlah))}
                  </td>
                  <td className="px-4 py-3 text-center font-mono text-xs text-stone-500">
                    {p.qty ?? "\u2014"}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-stone-500">
                    {p.sku || "\u2014"}
                  </td>
                  <td className="px-4 py-3 text-stone-500 text-xs">
                    {p.supplier || "\u2014"}
                  </td>
                  <td className="px-4 py-3 text-stone-500 text-xs max-w-[200px] truncate">
                    {p.keterangan || "\u2014"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleEditPersediaan(p)}
                      className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-stone-500 hover:bg-accent-light hover:text-accent-dark transition-colors"
                      title="Edit persediaan"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                      </svg>
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
                    formErrors.jumlah ? "border-red-300 bg-red-50" : "border-stone-200"
                  }`}
                />
                {formErrors.jumlah && <p className="mt-1 text-xs text-red-500">{formErrors.jumlah}</p>}
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

      {/* ── PinModal (verifikasi) ────────── */}
      <PinModal
        open={pinModal}
        onClose={() => setPinModal(false)}
        onSuccess={handlePinSuccess}
      />

      {/* ── EditFormModal ─────────────────── */}
      <EditFormModal
        open={editModal}
        type={editType}
        oldData={editItem}
        onSave={() => {}}
        onClose={handleEditClose}
        toast={setToast}
      />

      {/* ── Toast ─────────────────────────── */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[100] animate-bounce">
          <div className={`rounded-xl px-5 py-3 text-sm font-medium text-white shadow-lg ${
            toast.includes("tidak ditemukan") ? "bg-amber-600" : "bg-emerald-600"
          }`}>
            {toast}
          </div>
          <button
            onClick={() => setToast("")}
            className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-stone-500 shadow text-[10px]"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Reusable Components ──────────────────────────────────── */
function SectionLabel({ label, className = "" }) {
  return (
    <div className={`pt-1 ${className}`}>
      <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
        {label}:
      </span>
    </div>
  );
}

function LineItem({
  label,
  value,
  positive,
  negative,
  bold,
  borderTop,
  borderDouble,
  note,
}) {
  const colorClass = negative
    ? "text-red-600"
    : positive || positive === undefined
      ? "text-stone-700"
      : "text-red-600";

  const valueStr = negative
    ? `(${fmtRupiah(Math.abs(value))})`
    : fmtRupiah(value);

  return (
    <div
      className={`flex justify-between ${
        borderTop
          ? borderDouble
            ? "border-t-2 border-stone-300 pt-2"
            : "border-t border-stone-100 pt-2"
          : ""
      }`}
    >
      <span
        className={`${bold ? "font-semibold" : ""} text-stone-600`}
      >
        {label}
        {note && (
          <span className="block text-xs font-normal text-stone-400">
            {note}
          </span>
        )}
      </span>
      <span
        className={`font-mono ${bold ? "font-semibold text-base" : "text-sm"} ${colorClass}`}
      >
        {valueStr}
      </span>
    </div>
  );
}

function EmptyRow({ label }) {
  return (
    <div className="flex justify-between pl-4">
      <span className="text-stone-400 text-xs italic">{label}</span>
      <span className="font-mono text-stone-400 text-xs">—</span>
    </div>
  );
}

function SummaryCard({ label, value, color, fullWidth }) {
  const colors = {
    emerald: "bg-emerald-50 border-emerald-100",
    red: "bg-red-50 border-red-100",
    teal: "bg-accent-light border-accent-light",
  };
  const textColors = {
    emerald: "text-emerald-600",
    red: "text-red-600",
    teal: "text-accent-dark",
  };
  const valueColors = {
    emerald: "text-emerald-700",
    red: "text-red-700",
    teal: "text-accent-dark",
  };

  return (
    <div
      className={`rounded-2xl border p-5 ${colors[color]} ${
        fullWidth ? "col-span-2 md:col-span-1" : ""
      }`}
    >
      <p
        className={`text-xs font-medium uppercase tracking-wider ${textColors[color]}`}
      >
        {label}
      </p>
      <p className={`mt-1 text-xl font-semibold ${valueColors[color]}`}>
        {fmtRupiah(value)}
      </p>
    </div>
  );
}

/* ── Page Export (wrapped in Suspense) ────────────────────── */
export default function LaporanPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-200 border-t-accent" />
        </div>
      }
    >
      <LaporanInner />
    </Suspense>
  );
}
