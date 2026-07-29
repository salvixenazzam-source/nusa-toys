"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function KeuanganPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/laporan?tab=cashflow");
  }, [router]);
  return null;
}
