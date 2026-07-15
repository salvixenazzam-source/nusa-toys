"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { getSupabaseClient } from "@/lib/supabase";

/* ── Mapping: DB (snake_case) ↔ JS (camelCase) ───────────── */
const DB_TO_JS = {
  harga_modal: "hargaModal",
  harga_shopee: "hargaShopee",
  harga_wa: "hargaWa",
  harga_reseller: "hargaReseller",
  berat_gr: "beratGr",
  min_stok: "minStok",
  harga: "hargaSatuan",
  nama_produk: "namaProduk",
  harga_jual: "hargaJual",
  no_wa: "noWa",
  terakhir_beli: "terakhirBeli",
};

const JS_TO_DB = {
  hargaModal: "harga_modal",
  hargaShopee: "harga_shopee",
  hargaWa: "harga_wa",
  hargaReseller: "harga_reseller",
  beratGr: "berat_gr",
  minStok: "min_stok",
  hargaSatuan: "harga",
  namaProduk: "nama_produk",
  hargaJual: "harga_jual",
  noWa: "no_wa",
  terakhirBeli: "terakhir_beli",
};

function toCamel(dbRow) {
  const obj = {};
  for (const key of Object.keys(dbRow)) {
    const jsKey = DB_TO_JS[key] || key;
    obj[jsKey] = dbRow[key];
  }
  return obj;
}

function toSnake(jsObj) {
  const obj = {};
  for (const key of Object.keys(jsObj)) {
    const dbKey = JS_TO_DB[key] || key;
    obj[dbKey] = jsObj[key];
  }
  return obj;
}

/* ── Helper ──────────────────────────────────────────────── */
const getHargaByChannel = (product, channel) => {
  switch (channel) {
    case "WA": return product.hargaWa;
    case "Reseller": return product.hargaReseller;
    case "Shopee":
    default: return product.hargaShopee;
  }
};

const nextInvoice = (sales) => {
  const max = sales.reduce((m, s) => {
    const num = parseInt(s.invoice.replace("INV-", ""), 10);
    return num > m ? num : m;
  }, 0);
  return `INV-${String(max + 1).padStart(4, "0")}`;
};

/* ── Context ─────────────────────────────────────────────── */
const StoreContext = createContext(null);

export function ProductProvider({ children }) {
  const supabaseRef = useRef(null);
  if (!supabaseRef.current) supabaseRef.current = getSupabaseClient();
  const supabase = supabaseRef.current;

  /* ── Produk → Supabase ──────────────── */
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const loadProducts = useCallback(async () => {
    const { data, error } = await supabase.from("produk").select("*").order("sku");
    if (!error) setProducts(data.map(toCamel));
    setProductsLoading(false);
  }, [supabase]);
  useEffect(() => { loadProducts(); }, [loadProducts]);

  const addProduct = useCallback(async (p) => {
    const { data, error } = await supabase.from("produk").insert(toSnake(p)).select().single();
    if (error) return false;
    setProducts((prev) => [...prev, toCamel(data)]);
    return true;
  }, [supabase]);
  const updateProduct = useCallback(async (sku, data) => {
    const { error } = await supabase.from("produk").update(toSnake(data)).eq("sku", sku);
    if (error) return false;
    setProducts((prev) => prev.map((p) => (p.sku === sku ? { ...p, ...data } : p)));
    return true;
  }, [supabase]);
  const deleteProduct = useCallback(async (sku) => {
    const { error } = await supabase.from("produk").delete().eq("sku", sku);
    if (error) return false;
    setProducts((prev) => prev.filter((p) => p.sku !== sku));
    return true;
  }, [supabase]);
  const updateStock = useCallback(async (sku, delta) => {
    const { data } = await supabase.from("produk").select("stok").eq("sku", sku).single();
    if (!data) return false;
    const newStok = data.stok + delta;
    const { error } = await supabase.from("produk").update({ stok: newStok }).eq("sku", sku);
    if (error) return false;
    setProducts((prev) => prev.map((p) => (p.sku === sku ? { ...p, stok: newStok } : p)));
    return true;
  }, [supabase]);

  /* ── Pembelian → Supabase ───────────── */
  const [purchases, setPurchases] = useState([]);
  const [purchasesLoading, setPurchasesLoading] = useState(true);
  const loadPurchases = useCallback(async () => {
    const { data, error } = await supabase.from("pembelian").select("*").order("tanggal", { ascending: false });
    if (!error) setPurchases(data.map(toCamel));
    setPurchasesLoading(false);
  }, [supabase]);
  useEffect(() => { loadPurchases(); }, [loadPurchases]);
  const addPurchase = useCallback(async (item) => {
    const { data, error } = await supabase.from("pembelian").insert(toSnake(item)).select().single();
    if (error) return false;
    setPurchases((prev) => [toCamel(data), ...prev]);
    return true;
  }, [supabase]);

  /* ── Penjualan → Supabase ────────────── */
  const [sales, setSales] = useState([]);
  const [salesLoading, setSalesLoading] = useState(true);
  const loadSales = useCallback(async () => {
    const { data, error } = await supabase.from("penjualan").select("*").order("tanggal", { ascending: false });
    if (!error) setSales(data.map(toCamel));
    setSalesLoading(false);
  }, [supabase]);
  useEffect(() => { loadSales(); }, [loadSales]);
  const addSale = useCallback(async (sale) => {
    const { data, error } = await supabase.from("penjualan").insert(toSnake(sale)).select().single();
    if (error) return false;
    setSales((prev) => [toCamel(data), ...prev]);
    return true;
  }, [supabase]);

  /* ── Pelanggan → Supabase ────────────── */
  const [customers, setCustomers] = useState([]);
  const loadCustomers = useCallback(async () => {
    const { data, error } = await supabase.from("pelanggan").select("*").order("nama");
    if (!error) setCustomers(data.map(toCamel));
  }, [supabase]);
  useEffect(() => { loadCustomers(); }, [loadCustomers]);
  const upsertCustomer = useCallback(async (nama, tanggal) => {
    const { data: existing } = await supabase.from("pelanggan").select("id").ilike("nama", nama).maybeSingle();
    if (existing) {
      await supabase.from("pelanggan").update({ terakhir_beli: tanggal }).eq("id", existing.id);
      setCustomers((prev) => prev.map((c) => (c.id === existing.id ? { ...c, terakhirBeli: tanggal } : c)));
    } else {
      const { data: inserted, error } = await supabase.from("pelanggan").insert({ nama, terakhir_beli: tanggal }).select().single();
      if (!error && inserted) setCustomers((prev) => [...prev, toCamel(inserted)]);
    }
  }, [supabase]);
  const updateCustomer = useCallback(async (id, data) => {
    await supabase.from("pelanggan").update(toSnake(data)).eq("id", id);
    setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, ...data } : c)));
  }, [supabase]);

  /* ── Keuangan → Supabase ─────────────── */
  const [keuangan, setKeuangan] = useState([]);
  const loadKeuangan = useCallback(async () => {
    const { data, error } = await supabase.from("keuangan").select("*").order("tanggal", { ascending: false });
    if (!error) setKeuangan(data);
  }, [supabase]);
  useEffect(() => { loadKeuangan(); }, [loadKeuangan]);
  const addKeuangan = useCallback(async (item) => {
    const { data, error } = await supabase.from("keuangan").insert(item).select().single();
    if (error) return false;
    setKeuangan((prev) => [data, ...prev]);
    return true;
  }, [supabase]);

  /* ── Target Omzet ───────────────────── */
  const [targetOmzet, setTargetOmzet] = useState(2000000);

  return (
    <StoreContext.Provider
      value={{
        products, productsLoading, addProduct, updateProduct, deleteProduct, updateStock,
        sales, salesLoading, addSale,
        customers, upsertCustomer, updateCustomer,
        keuangan, addKeuangan,
        purchases, purchasesLoading, addPurchase,
        targetOmzet, setTargetOmzet,
        getHargaByChannel, nextInvoice,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

/* ── Hooks ───────────────────────────────────────────────── */
export function useProducts() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useProducts must be inside ProductProvider");
  return ctx;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be inside ProductProvider");
  return ctx;
}
