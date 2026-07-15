"use client";

import { createContext, useContext, useState, useCallback } from "react";

/* ── Data Awal (Fase A — Hardcode) ────────────────────────── */
const INITIAL_PRODUCTS = [
  { sku: "NT001", nama: "Robot Line Follower", kategori: "Robot Edukasi", supplier: "TechKids", hargaModal: 85000, hargaShopee: 150000, hargaWa: 135000, hargaReseller: 110000, beratGr: 250, stok: 12, minStok: 5, status: "Aktif" },
  { sku: "NT002", nama: "Robot Soccer", kategori: "Robot Kompetisi", supplier: "RoboLab", hargaModal: 250000, hargaShopee: 400000, hargaWa: 375000, hargaReseller: 300000, beratGr: 500, stok: 3, minStok: 5, status: "Aktif" },
  { sku: "NT003", nama: "Drone Mini Kamera", kategori: "Drone", supplier: "SkyTech", hargaModal: 180000, hargaShopee: 320000, hargaWa: 290000, hargaReseller: 230000, beratGr: 120, stok: 0, minStok: 3, status: "Aktif" },
  { sku: "NT004", nama: "Arduino Starter Kit", kategori: "Mikrokontroler", supplier: "TechKids", hargaModal: 95000, hargaShopee: 175000, hargaWa: 160000, hargaReseller: 125000, beratGr: 350, stok: 20, minStok: 10, status: "Aktif" },
  { sku: "NT005", nama: "Robot Arm 4-Axis", kategori: "Robot Kompetisi", supplier: "RoboLab", hargaModal: 450000, hargaShopee: 750000, hargaWa: 700000, hargaReseller: 550000, beratGr: 800, stok: 1, minStok: 2, status: "Nonaktif" },
];

const INITIAL_PURCHASES = [
  { id: 1, tanggal: "2026-07-01", supplier: "TechKids", sku: "NT001", qty: 10, hargaSatuan: 80000, ongkir: 25000, total: 825000 },
  { id: 2, tanggal: "2026-07-03", supplier: "RoboLab", sku: "NT002", qty: 5, hargaSatuan: 240000, ongkir: 50000, total: 1250000 },
  { id: 3, tanggal: "2026-07-05", supplier: "SkyTech", sku: "NT003", qty: 3, hargaSatuan: 175000, ongkir: 15000, total: 540000 },
  { id: 4, tanggal: "2026-07-08", supplier: "TechKids", sku: "NT004", qty: 20, hargaSatuan: 90000, ongkir: 35000, total: 1835000 },
];

const INITIAL_SALES = [
  { id: 1, tanggal: "2026-07-02", invoice: "INV-0001", pembeli: "Rudi", channel: "Shopee", sku: "NT001", qty: 2, omzet: 300000, ongkir: 0, status: "Lunas", namaProduk: "Robot Line Follower", hargaJual: 150000, laba: 130000 },
  { id: 2, tanggal: "2026-07-04", invoice: "INV-0002", pembeli: "Santi", channel: "WA", sku: "NT002", qty: 1, omzet: 375000, ongkir: 0, status: "Lunas", namaProduk: "Robot Soccer", hargaJual: 375000, laba: 125000 },
  { id: 3, tanggal: "2026-07-06", invoice: "INV-0003", pembeli: "Sekolah Alam", channel: "Sekolah", sku: "NT004", qty: 5, omzet: 625000, ongkir: 15000, status: "Lunas", namaProduk: "Arduino Starter Kit", hargaJual: 125000, laba: 150000 },
];

const INITIAL_CUSTOMERS = [
  { id: 1, nama: "Rudi", noWa: "081234567890", instansi: "SMAN 1", terakhirBeli: "2026-07-02" },
  { id: 2, nama: "Santi", noWa: "089876543210", instansi: "Komunitas Robot", terakhirBeli: "2026-07-04" },
  { id: 3, nama: "Sekolah Alam", noWa: "085512345678", instansi: "SDIT Alam", terakhirBeli: "2026-07-06" },
];

const INITIAL_KEUANGAN = [
  { id: 1, tanggal: "2026-07-02", tipe: "Pemasukan", kategori: "Penjualan", jumlah: 300000, keterangan: "Penjualan INV-0001" },
  { id: 2, tanggal: "2026-07-04", tipe: "Pemasukan", kategori: "Penjualan", jumlah: 375000, keterangan: "Penjualan INV-0002" },
  { id: 3, tanggal: "2026-07-05", tipe: "Pengeluaran", kategori: "Pembelian", jumlah: 540000, keterangan: "Pembelian NT003" },
  { id: 4, tanggal: "2026-07-06", tipe: "Pemasukan", kategori: "Penjualan", jumlah: 625000, keterangan: "Penjualan INV-0003" },
];

/* ── Helper ──────────────────────────────────────────────── */
let nextId = 100; // counter untuk ID baru

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
  /* ── Produk ──────────────────────────── */
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [productsLoading, setProductsLoading] = useState(false);

  const addProduct = useCallback(async (p) => {
    setProducts((prev) => [...prev, p]);
    return true;
  }, []);

  const updateProduct = useCallback(async (sku, data) => {
    setProducts((prev) => prev.map((p) => (p.sku === sku ? { ...p, ...data } : p)));
    return true;
  }, []);

  const deleteProduct = useCallback(async (sku) => {
    setProducts((prev) => prev.filter((p) => p.sku !== sku));
    return true;
  }, []);

  const updateStock = useCallback(async (sku, delta) => {
    setProducts((prev) =>
      prev.map((p) => (p.sku === sku ? { ...p, stok: p.stok + delta } : p))
    );
    return true;
  }, []);

  /* ── Pembelian ───────────────────────── */
  const [purchases, setPurchases] = useState(INITIAL_PURCHASES);
  const [purchasesLoading, setPurchasesLoading] = useState(false);

  const addPurchase = useCallback(async (item) => {
    const newItem = { id: ++nextId, ...item };
    setPurchases((prev) => [newItem, ...prev]);
    return true;
  }, []);

  /* ── Penjualan ───────────────────────── */
  const [sales, setSales] = useState(INITIAL_SALES);
  const [salesLoading, setSalesLoading] = useState(false);

  const addSale = useCallback(async (sale) => {
    const newSale = { id: ++nextId, ...sale };
    setSales((prev) => [newSale, ...prev]);
    return true;
  }, []);

  /* ── Pelanggan ───────────────────────── */
  const [customers, setCustomers] = useState(INITIAL_CUSTOMERS);

  const upsertCustomer = useCallback(async (nama, tanggal) => {
    setCustomers((prev) => {
      const existing = prev.find((c) => c.nama.toLowerCase() === nama.toLowerCase());
      if (existing) {
        return prev.map((c) => (c.id === existing.id ? { ...c, terakhirBeli: tanggal } : c));
      }
      const newCust = { id: ++nextId, nama, noWa: "", instansi: "", terakhirBeli: tanggal };
      return [...prev, newCust];
    });
  }, []);

  const updateCustomer = useCallback(async (id, data) => {
    setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, ...data } : c)));
  }, []);

  /* ── Keuangan ────────────────────────── */
  const [keuangan, setKeuangan] = useState(INITIAL_KEUANGAN);

  const addKeuangan = useCallback(async (item) => {
    const newItem = { id: ++nextId, ...item };
    setKeuangan((prev) => [newItem, ...prev]);
    return true;
  }, []);

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
