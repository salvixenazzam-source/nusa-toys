"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase";

const menuItems = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/produk", label: "Produk", icon: "📦" },
  { href: "/diskon", label: "Diskon", icon: "🏷️" },
  { href: "/inventory", label: "Inventory", icon: "📋" },
  { href: "/pembelian", label: "Pembelian", icon: "🛒" },
  { href: "/penjualan", label: "Penjualan", icon: "💰" },
  { href: "/keuangan", label: "Keuangan", icon: "💵" },
  { href: "/laporan", label: "Laporan", icon: "📈" },
  { href: "/crm", label: "CRM", icon: "👥" },
  { href: "/pengaturan", label: "Pengaturan", icon: "⚙️" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar */}
      <div className="fixed top-0 left-0 right-0 z-30 flex h-14 items-center justify-between bg-stone-50 px-4 md:hidden border-b border-stone-200">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt=""
            width={32}
            height={32}
            className="h-7 w-7 rounded-md"
            priority
          />
          <span className="text-sm font-bold text-stone-800">Nusa Toys</span>
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-lg p-2 text-stone-500 hover:bg-stone-200"
          aria-label="Toggle menu"
        >
          {mobileOpen ? (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M5 5l10 10M15 5L5 15" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 5h14M3 10h14M3 15h14" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <nav className="absolute top-0 left-0 bottom-0 w-64 bg-stone-50 shadow-xl pt-14 overflow-y-auto border-r border-stone-200">
            <SidebarContent
              pathname={pathname}
              onNavigate={() => setMobileOpen(false)}
            />
          </nav>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-64 md:shrink-0 md:flex-col bg-stone-50 border-r-2 border-stone-300 shadow-[2px_0_8px_rgba(0,0,0,0.04)]">
        <Link href="/dashboard" className="flex items-center gap-3 px-5 py-4 border-b border-stone-200">
          <Image
            src="/logo.png"
            alt=""
            width={36}
            height={36}
            className="h-8 w-8 rounded-lg shrink-0"
            priority
          />
          <span className="text-lg font-bold tracking-tight text-stone-800">Nusa Toys</span>
        </Link>
        <nav className="flex-1 overflow-y-auto py-3">
          <SidebarContent pathname={pathname} />
        </nav>
        {/* Logout — desktop */}
        <div className="hidden md:block px-4 pb-4 border-t border-stone-200 pt-3">
          <DesktopLogoutButton />
        </div>
      </aside>
    </>
  );
}

function DesktopLogoutButton() {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <button
      onClick={handleLogout}
      disabled={loggingOut}
      className="flex items-center gap-2 w-full rounded-xl px-3 py-2.5 text-sm font-medium text-stone-500 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
    >
      <svg
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
        />
      </svg>
      {loggingOut ? "Keluar..." : "Logout"}
    </button>
  );
}

function SidebarContent({ pathname, onNavigate }) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
    onNavigate?.();
    router.push("/login");
    router.refresh();
  };

  return (
    <>
      <ul className="flex flex-col gap-0.5 px-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onNavigate}
                className={`flex items-center gap-3 rounded-xl px-3 py-3 text-base font-medium transition-colors ${
                  isActive
                    ? "bg-accent-light text-accent-dark"
                    : "text-stone-600 hover:bg-stone-200 hover:text-stone-800"
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
      {/* Logout — mobile */}
      <div className="md:hidden mt-auto px-2 pb-4 pt-2 border-t border-stone-200">
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex items-center gap-3 rounded-xl px-3 py-3 text-base font-medium text-stone-500 hover:bg-red-50 hover:text-red-600 transition-colors w-full text-left disabled:opacity-50"
        >
          <span className="text-lg">🚪</span>
          {loggingOut ? "Keluar..." : "Logout"}
        </button>
      </div>
    </>
  );
}
