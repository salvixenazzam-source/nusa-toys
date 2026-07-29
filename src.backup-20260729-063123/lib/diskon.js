/**
 * Diskon helper — kalkulasi & query diskon aktif dari Supabase.
 * Digunakan bersama ProductContext untuk state management.
 */

import { getSupabaseClient } from "@/lib/supabase";

/* ── Ambil semua diskon aktif hari ini ──────────────────── */
export async function fetchDiskonAktif(supabase) {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  const { data: diskonData, error } = await supabase
    .from("diskon")
    .select(`
      *,
      diskon_kategori (kategori),
      diskon_produk (produk_id)
    `)
    .eq("aktif", true)
    .lte("mulai", today)
    .or(`selesai.is.null,selesai.gte.${today}`);

  if (error) {
    console.error("Gagal fetch diskon:", error);
    return [];
  }

  return diskonData.map((d) => ({
    ...d,
    kategori_list: (d.diskon_kategori || []).map((k) => k.kategori),
    produk_ids: (d.diskon_produk || []).map((p) => p.produk_id),
  }));
}

/* ── Hitung diskon terbaik untuk satu item ──────────────── */
export function hitungDiskon(produk, qty, totalCart, diskonAktifList) {
  if (!diskonAktifList || diskonAktifList.length === 0) {
    return { diskon: null, hematIDR: 0, hargaFinal: produk.hargaJual * qty, marginWarning: false };
  }

  const hargaJual = produk.hargaJual || 0;

  // Filter diskon yang berlaku untuk produk ini
  const kandidat = diskonAktifList.filter((d) => {
    // Cek kuota
    if (d.kuota !== null && d.kuota_terpakai >= d.kuota) return false;
    // Cek minimal pembelian
    if (d.min_pembelian && totalCart < d.min_pembelian) return false;
    // Cek berlaku_untuk
    if (d.berlaku_untuk === "SEMUA") return true;
    if (d.berlaku_untuk === "KATEGORI") {
      return d.kategori_list && d.kategori_list.includes(produk.kategori);
    }
    if (d.berlaku_untuk === "SKU") {
      return d.produk_ids && d.produk_ids.includes(produk.id);
    }
    return false;
  });

  if (kandidat.length === 0) {
    return { diskon: null, hematIDR: 0, hargaFinal: hargaJual * qty, marginWarning: false };
  }

  // Hitung hemat terbesar
  let terbaik = null;
  let maxHemat = 0;

  for (const d of kandidat) {
    let hemat = 0;
    if (d.jenis === "PERSEN") {
      hemat = hargaJual * (d.nilai / 100) * qty;
    } else if (d.jenis === "NOMINAL") {
      hemat = Number(d.nilai); // nominal fixed, per transaksi bukan per item
    } else if (d.jenis === "BELI_X_GRATIS_Y") {
      if (d.beli_min_qty && qty >= d.beli_min_qty && d.nilai_gratis) {
        const unitGratis = Math.floor(qty / d.beli_min_qty) * d.nilai_gratis;
        hemat = hargaJual * unitGratis;
      }
    } else if (d.jenis === "BUNDLE") {
      // BUNDLE: harga spesial — hemat = (harga_normal - harga_bundle) * qty
      // nilai menyimpan harga bundle
      hemat = (hargaJual - Number(d.nilai)) * qty;
      if (hemat < 0) hemat = 0;
    }

    // Prioritaskan: jika level sama, ambil hemat terbesar
    if (hemat > maxHemat) {
      maxHemat = hemat;
      terbaik = d;
    }
  }

  const hargaFinal = hargaJual * qty - maxHemat;
  const marginWarning = produk.hargaModal ? hargaFinal < produk.hargaModal * qty : false;

  return {
    diskon: terbaik,
    hematIDR: Math.round(maxHemat),
    hargaFinal: Math.max(0, Math.round(hargaFinal)),
    marginWarning,
  };
}
