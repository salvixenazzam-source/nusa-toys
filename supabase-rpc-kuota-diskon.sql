-- ============================================================
-- NUSA TOYS — RPC: increment_kuota_diskon (atomic kuota increment)
-- Jalankan di Supabase SQL Editor
-- ============================================================

-- Fungsi untuk increment kuota_terpakai secara atomic (hindari race condition)
-- Return: kuota_terpakai baru, atau NULL jika kuota sudah penuh/error
CREATE OR REPLACE FUNCTION increment_kuota_diskon(diskon_id_param UUID)
RETURNS INT AS $$
DECLARE
  new_kuota_terpakai INT;
BEGIN
  UPDATE diskon
  SET kuota_terpakai = kuota_terpakai + 1,
      updated_at = NOW()
  WHERE id = diskon_id_param
    AND (kuota IS NULL OR kuota_terpakai < kuota)
  RETURNING kuota_terpakai INTO new_kuota_terpakai;

  -- Return NULL jika kuota sudah penuh (tidak ada row yang ter-update)
  RETURN new_kuota_terpakai;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Izinkan anon dan authenticated memanggil fungsi ini
GRANT EXECUTE ON FUNCTION increment_kuota_diskon(UUID) TO anon, authenticated;
