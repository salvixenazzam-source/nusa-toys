-- ============================================================
-- NUSA TOYS — Cek trigger di database
-- Jalankan di Supabase SQL Editor
-- ============================================================

-- 1. Cari semua trigger yang terkait tabel produk, penjualan, persediaan
SELECT 
    tgname AS trigger_name,
    relname AS table_name,
    proname AS function_name,
    pg_get_triggerdef(t.oid) AS trigger_def
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE NOT t.tgisinternal
  AND c.relname IN ('produk', 'penjualan', 'persediaan', 'jurnal', 'jurnal_item', 'keuangan')
ORDER BY c.relname, tgname;

-- 2. Cek definisi fungsi update_stok
SELECT pg_get_functiondef('update_stok(text,int)'::regprocedure);

-- 3. Cek semua RPC/function yang ada
SELECT 
    n.nspname AS schema,
    p.proname AS function_name,
    pg_get_function_arguments(p.oid) AS arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
  AND p.prokind = 'f'
ORDER BY n.nspname, p.proname;
