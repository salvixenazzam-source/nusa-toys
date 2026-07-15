"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";

export default function AppShell({ children }) {
  const pathname = usePathname();

  const isLoginPage = pathname === "/login";

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-full">
      <div className="flex flex-col h-full md:w-64 md:shrink-0">
        <Sidebar />
      </div>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
