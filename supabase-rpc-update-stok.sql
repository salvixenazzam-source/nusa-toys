-- ============================================================
-- NUSA TOYS — RPC: update_stok (atomic stock update)
-- Jalankan di Supabase SQL Editor
-- ============================================================

-- Fungsi untuk update stok secara atomic (hindari race condition)
-- Digunakan oleh ProductContext.updateStock() via supabase.rpc()
CREATE OR REPLACE FUNCTION update_stok(sku_param TEXT, delta_param INT)
RETURNS INT AS $$
DECLARE
  new_stok INT;
BEGIN
  UPDATE produk
  SET stok = GREATEST(0, stok + delta_param)
  WHERE sku = sku_param
    AND (delta_param >= 0 OR stok >= ABS(delta_param))
  RETURNING stok INTO new_stok;

  -- Jika tidak ada row yang ter-update (stok tidak cukup atau SKU tidak ditemukan),
  -- new_stok akan NULL. Return NULL agar client tahu operasi gagal.
  RETURN new_stok;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Izinkan anon dan authenticated memanggil fungsi ini
GRANT EXECUTE ON FUNCTION update_stok(TEXT, INT) TO anon, authenticated;
