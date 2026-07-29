"use client";

import { ProductProvider } from "@/lib/ProductContext";

export default function Providers({ children }) {
  return <ProductProvider>{children}</ProductProvider>;
}
