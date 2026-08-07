"use client";

import { useState, useRef } from "react";

/**
 * PinModal — modal input PIN (masked).
 * Submit ke /api/verify-pin.
 * PIN salah → pesan error, tetap di modal.
 * PIN benar → panggil onSuccess (biasanya buka EditFormModal).
 */
export default function PinModal({ open, onClose, onSuccess }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pin || pin.length < 1) {
      setError("PIN wajib diisi");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/verify-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });

      const data = await res.json();

      if (data.ok) {
        setPin("");
        setError("");
        onSuccess();
      } else {
        setError("PIN salah, coba lagi");
        setPin("");
        inputRef.current?.focus();
      }
    } catch {
      setError("Gagal verifikasi. Cek koneksi.");
    }

    setLoading(false);
  };

  const handleClose = () => {
    setPin("");
    setError("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto pt-20 pb-10">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <div className="text-center">
          {/* Icon lock */}
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-50">
            <svg
              className="h-6 w-6 text-amber-600"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
              />
            </svg>
          </div>

          <h2 className="text-lg font-semibold text-stone-800">
            Verifikasi PIN
          </h2>
          <p className="mt-1 text-sm text-stone-400">
            Masukkan PIN untuk mengedit transaksi
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <input
              ref={inputRef}
              type="password"
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                setError("");
              }}
              placeholder="Masukkan PIN"
              autoFocus
              className={`w-full rounded-xl border px-4 py-3 text-center text-lg tracking-[0.3em] outline-none focus:ring-2 focus:ring-accent/30 ${
                error ? "border-red-300 bg-red-50" : "border-stone-200"
              }`}
            />
            {error && (
              <p className="mt-2 text-center text-sm text-red-500">{error}</p>
            )}
          </div>

          <div className="flex justify-center gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-stone-500 transition-colors hover:bg-stone-100"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-dark disabled:opacity-60"
            >
              {loading ? "Memverifikasi..." : "Verifikasi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
