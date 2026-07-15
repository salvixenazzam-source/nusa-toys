"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);

  return (
    <div className="flex min-h-full items-center justify-center bg-stone-50 px-4">
      <p className="text-sm text-stone-400">Mengarahkan ke dashboard...</p>
    </div>
  );
}
