"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Email wajib diisi.");
      return;
    }
    if (!password) {
      setError("Password wajib diisi.");
      return;
    }

    setLoading(true);
    const supabase = getSupabaseClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);

    if (authError) {
      if (authError.message.includes("Invalid login")) {
        setError("Email atau password salah.");
      } else if (authError.message.includes("Email not confirmed")) {
        setError("Email belum dikonfirmasi. Cek inbox Anda.");
      } else {
        setError(authError.message);
      }
      return;
    }

    router.push("/dashboard");
  };

  return (
    <div className="flex min-h-full items-center justify-center bg-stone-50 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-stone-800">Nusa Toys</h1>
          <p className="mt-1 text-sm text-stone-500">Masuk ke dashboard manajemen toko</p>
        </div>

        {/* Card */}
        <form
          onSubmit={handleLogin}
          className="rounded-2xl bg-white border border-stone-100 p-6 shadow-sm"
        >
          {error && (
            <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-medium text-stone-500 mb-1"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@nusatoys.com"
                autoComplete="email"
                className="w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm outline-none transition-colors focus:ring-2 focus:ring-accent/30"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-medium text-stone-500 mb-1"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm outline-none transition-colors focus:ring-2 focus:ring-accent/30"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-dark disabled:opacity-60"
          >
            {loading ? "Masuk..." : "Masuk"}
          </button>
        </form>
      </div>
    </div>
  );
}
