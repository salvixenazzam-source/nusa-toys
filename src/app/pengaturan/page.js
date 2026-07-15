"use client";

import { useState } from "react";
import { useStore } from "@/lib/ProductContext";

const fmtRupiah = (n) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

export default function PengaturanPage() {
  const { targetOmzet, setTargetOmzet } = useStore();
  const [inputValue, setInputValue] = useState(String(targetOmzet));
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    const num = parseInt(inputValue.replace(/\D/g, ""), 10) || 0;
    setTargetOmzet(num);
    setInputValue(String(num));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="px-4 py-6 md:px-10 md:py-10 max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight text-stone-800">Pengaturan</h1>
      <p className="mt-1 text-sm text-stone-500">
        Konfigurasi preferensi toko, target bisnis, dan koneksi Google Sheets.
      </p>

      {/* ── Target Omzet ──────────────────────────────── */}
      <section className="mt-8 rounded-2xl border border-stone-100 bg-white p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-400 mb-1">
          🎯 Target Omzet Bulanan
        </h2>
        <p className="text-xs text-stone-400 mb-4">
          Target ini digunakan untuk progress bar di Dashboard.
        </p>

        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="block text-xs font-medium text-stone-500 mb-1.5">
              TARGET OMZET (Rp)
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={inputValue}
              onChange={(e) => {
                const raw = e.target.value.replace(/\D/g, "");
                setInputValue(raw);
                setSaved(false);
              }}
              onBlur={() => {
                if (!inputValue || inputValue === "0") {
                  setInputValue(String(targetOmzet));
                }
              }}
              className="w-full rounded-lg border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm font-mono text-stone-800 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
              placeholder="2000000"
            />
            {inputValue && (
              <p className="mt-1 text-xs text-stone-400">
                ≈ {fmtRupiah(parseInt(inputValue, 10) || 0)}
              </p>
            )}
          </div>
          <button
            onClick={handleSave}
            disabled={!inputValue || parseInt(inputValue, 10) === targetOmzet}
            className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-dark disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saved ? "✅ Tersimpan" : "Simpan"}
          </button>
        </div>

        {/* Preset cepat */}
        <div className="mt-4 flex flex-wrap gap-2">
          {[1000000, 2000000, 5000000, 10000000].map((val) => (
            <button
              key={val}
              onClick={() => {
                setInputValue(String(val));
                setSaved(false);
              }}
              className={`rounded-full px-3 py-1 text-[11px] font-medium transition-colors ${
                parseInt(inputValue, 10) === val
                  ? "bg-accent text-white"
                  : "bg-stone-100 text-stone-500 hover:bg-stone-200"
              }`}
            >
              {fmtRupiah(val)}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
