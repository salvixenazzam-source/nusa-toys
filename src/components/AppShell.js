"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AppShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const isLoginPage = pathname === "/login";

  if (isLoginPage) {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    setLoggingOut(true);
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="flex h-full">
      <div className="flex flex-col h-full">
        <Sidebar />
        {/* Logout button */}
        <div className="hidden md:block px-4 pb-4 border-t border-stone-200 pt-3 bg-stone-50">
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
        </div>
      </div>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
