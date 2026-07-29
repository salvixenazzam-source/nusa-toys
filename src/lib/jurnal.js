/* ── Mapping Kode Akun ──────────────────────────────────── */
const AKUN_KODE = {
  KAS: "1100",
  PERSEDIAAN: "1200",
  MODAL: "3100",
  PENDAPATAN: "4100",
  HPP: "5100",
  BEBAN_OPERASIONAL: "5200",
  BEBAN_GAJI: "5201",
  BEBAN_PAJAK: "5202",
  BEBAN_LAINNYA: "5299",
};

const KATEGORI_TO_AKUN = {
  Operasional: "5200",
  Gaji: "5201",
  Pajak: "5202",
  Lainnya: "5299",
  BeliStok: null, // tidak digunakan — pembelian via addPurchase
  HPP: null,      // tidak digunakan — HPP via penjualan
};

/**
 * Cari akun_id berdasarkan kode akun
 */
export async function getAkunByKode(supabase, kode) {
  const { data, error } = await supabase
    .from("akun")
    .select("id")
    .eq("kode", kode)
    .single();
  if (error || !data) {
    throw new Error(`Akun dengan kode ${kode} tidak ditemukan: ${error?.message || "not found"}`);
  }
  return data.id;
}

/**
 * Tambah jurnal baru + jurnal_item dalam 1 transaksi (manual)
 * @param {Object} supabase - Supabase client instance
 * @param {Object} params
 * @param {string} params.tanggal - YYYY-MM-DD
 * @param {string} params.keterangan - Deskripsi jurnal
 * @param {string} params.ref_type - 'Penjualan' | 'Penjualan-HPP' | 'Pembelian' | 'Keuangan'
 * @param {number} params.ref_id - ID dari tabel asal
 * @param {Array<{akun_id: number, debit: number, kredit: number, keterangan?: string}>} params.items
 */
export async function addJurnal(supabase, { tanggal, keterangan, ref_type, ref_id, items }) {
  if (!items || items.length === 0) {
    throw new Error("Jurnal harus memiliki minimal 1 item");
  }

  // Validasi balance: total debit == total kredit
  const totalDebit = items.reduce((sum, i) => sum + (Number(i.debit) || 0), 0);
  const totalKredit = items.reduce((sum, i) => sum + (Number(i.kredit) || 0), 0);

  if (totalDebit !== totalKredit) {
    throw new Error(
      `Jurnal tidak balance: Debit=${totalDebit}, Kredit=${totalKredit}`
    );
  }

  if (totalDebit === 0 && totalKredit === 0) {
    throw new Error("Jurnal tidak boleh bernilai 0");
  }

  // Insert jurnal header
  const { data: jurnalData, error: jurnalError } = await supabase
    .from("jurnal")
    .insert({
      tanggal,
      keterangan,
      ref_type,
      ref_id,
    })
    .select()
    .single();

  if (jurnalError) {
    throw new Error(`Gagal insert jurnal: ${jurnalError.message}`);
  }

  // Insert jurnal items
  const jurnalItems = items.map((item) => ({
    jurnal_id: jurnalData.id,
    akun_id: item.akun_id,
    debit: Number(item.debit) || 0,
    kredit: Number(item.kredit) || 0,
    keterangan: item.keterangan || "",
  }));

  const { error: itemsError } = await supabase
    .from("jurnal_item")
    .insert(jurnalItems);

  if (itemsError) {
    throw new Error(`Gagal insert jurnal_item: ${itemsError.message}`);
  }

  return jurnalData;
}

/* ── Trigger: Penjualan ──────────────────────────────────── */
/**
 * Catat jurnal otomatis dari penjualan baru:
 *   1. Jurnal Penjualan: Debit Kas / Kredit Pendapatan = omzet
 *   2. Jurnal HPP: Debit HPP / Kredit Persediaan = total harga_modal
 */
export async function jurnalPenjualan(supabase, sale) {
  const akunKas = await getAkunByKode(supabase, AKUN_KODE.KAS);
  const akunPendapatan = await getAkunByKode(supabase, AKUN_KODE.PENDAPATAN);
  const akunHPP = await getAkunByKode(supabase, AKUN_KODE.HPP);
  const akunPersediaan = await getAkunByKode(supabase, AKUN_KODE.PERSEDIAAN);

  const omzet = Number(sale.omzet) || 0;
  const hargaModal = (Number(sale.qty) || 0) * (Number(sale.hargaModal) || 0);

  // Jurnal 1: Penjualan
  if (omzet > 0) {
    await addJurnal(supabase, {
      tanggal: sale.tanggal,
      keterangan: `Penjualan ${sale.invoice} — ${sale.pembeli}`,
      ref_type: "Penjualan",
      ref_id: sale.id,
      items: [
        { akun_id: akunKas, debit: omzet, kredit: 0 },
        { akun_id: akunPendapatan, debit: 0, kredit: omzet },
      ],
    });
  }

  // Jurnal 2: HPP
  if (hargaModal > 0) {
    await addJurnal(supabase, {
      tanggal: sale.tanggal,
      keterangan: `HPP ${sale.invoice} — ${sale.pembeli}`,
      ref_type: "Penjualan-HPP",
      ref_id: sale.id,
      items: [
        { akun_id: akunHPP, debit: hargaModal, kredit: 0 },
        { akun_id: akunPersediaan, debit: 0, kredit: hargaModal },
      ],
    });
  }
}

/* ── Trigger: Pembelian ──────────────────────────────────── */
/**
 * Catat jurnal otomatis dari pembelian stok:
 *   Debit Persediaan / Kredit Kas = total (qty × hargaSatuan, tanpa ongkir)
 */
export async function jurnalPembelian(supabase, purchase) {
  const akunPersediaan = await getAkunByKode(supabase, AKUN_KODE.PERSEDIAAN);
  const akunKas = await getAkunByKode(supabase, AKUN_KODE.KAS);

  const qty = Number(purchase.qty) || 0;
  const hargaSatuan = Number(purchase.hargaSatuan) || 0;
  const total = qty * hargaSatuan;

  // Ongkir tidak masuk persediaan, sudah dicatat terpisah sebagai Beban Operasional
  if (total > 0) {
    await addJurnal(supabase, {
      tanggal: purchase.tanggal,
      keterangan: `Pembelian stok — ${purchase.supplier || "Supplier"}`,
      ref_type: "Pembelian",
      ref_id: purchase.id,
      items: [
        { akun_id: akunPersediaan, debit: total, kredit: 0 },
        { akun_id: akunKas, debit: 0, kredit: total },
      ],
    });
  }
}

/* ── Trigger: Keuangan (Pengeluaran) ──────────────────────── */
/**
 * Catat jurnal otomatis dari biaya operasional (Pengeluaran):
 *   Debit Beban (sesuai kategori) / Kredit Kas = jumlah
 */
export async function jurnalKeuangan(supabase, item) {
  // Hanya catat untuk Pengeluaran selain kategori Beli Stok & HPP (sudah via penjualan/pembelian)
  if (item.tipe !== "Pengeluaran") return;
  if (item.kategori === "Beli Stok" || item.kategori === "HPP") return;

  const akunKas = await getAkunByKode(supabase, AKUN_KODE.KAS);
  const kodeBeban = KATEGORI_TO_AKUN[item.kategori] || AKUN_KODE.BEBAN_LAINNYA;
  const akunBeban = await getAkunByKode(supabase, kodeBeban);

  const jumlah = Number(item.jumlah) || 0;
  if (jumlah > 0) {
    await addJurnal(supabase, {
      tanggal: item.tanggal,
      keterangan: item.keterangan || `Biaya ${item.kategori}`,
      ref_type: "Keuangan",
      ref_id: item.id,
      items: [
        { akun_id: akunBeban, debit: jumlah, kredit: 0 },
        { akun_id: akunKas, debit: 0, kredit: jumlah },
      ],
    });
  }
}

/* ── Laporan P&L (Laba Rugi) ──────────────────────────────── */
/**
 * Helper: aggregate jurnal_item rows by akun
 */
function aggregateByAkun(rows) {
  const map = {};
  for (const row of rows) {
    const id = row.akun_id;
    if (!map[id]) {
      map[id] = {
        akun_id: id,
        kode: row.akun?.kode,
        nama: row.akun?.nama,
        tipe: row.akun?.tipe,
        saldo_normal: row.akun?.saldo_normal,
        total_debit: 0,
        total_kredit: 0,
      };
    }
    map[id].total_debit += Number(row.debit) || 0;
    map[id].total_kredit += Number(row.kredit) || 0;
  }
  return Object.values(map).sort((a, b) => a.kode.localeCompare(b.kode));
}

/**
 * Ambil summary akun Pendapatan & Beban dalam rentang tanggal
 */
export async function getPnL(supabase, startDate, endDate) {
  const { data, error } = await supabase
    .from("jurnal_item")
    .select(`
      akun_id,
      akun!inner(kode, nama, tipe, saldo_normal),
      debit, kredit,
      jurnal!inner(tanggal)
    `)
    .in("akun.tipe", ["Pendapatan", "Beban"])
    .gte("jurnal.tanggal", startDate)
    .lte("jurnal.tanggal", endDate)
    .order("akun_id");

  if (error) throw error;
  return aggregateByAkun(data);
}

/* ── Laporan Neraca ───────────────────────────────────────── */
/**
 * Ambil summary akun Aset, Kewajiban, Modal dalam rentang tanggal
 */
export async function getNeraca(supabase, startDate, endDate) {
  const { data, error } = await supabase
    .from("jurnal_item")
    .select(`
      akun_id,
      akun!inner(kode, nama, tipe, saldo_normal),
      debit, kredit,
      jurnal!inner(tanggal)
    `)
    .in("akun.tipe", ["Aset", "Kewajiban", "Modal"])
    .gte("jurnal.tanggal", startDate)
    .lte("jurnal.tanggal", endDate);

  if (error) throw error;
  return aggregateByAkun(data);
}

/**
 * Ambil daftar jurnal (untuk UI nanti)
 */
export async function getJurnalList(supabase, startDate, endDate) {
  const { data, error } = await supabase
    .from("jurnal")
    .select("*, jurnal_item(id, akun_id, debit, kredit, keterangan, akun!inner(nama, kode))")
    .gte("tanggal", startDate)
    .lte("tanggal", endDate)
    .order("tanggal", { ascending: false })
    .order("id", { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Summary Investasi Persediaan dari jurnal akun 1200
 * - Debit  = total pembelian stok
 * - Kredit = total HPP (barang terjual)
 * - Sisa   = Debit - Kredit
 */
export async function getPersediaanSummary(supabase, startDate, endDate) {
  const { data, error } = await supabase
    .from("jurnal_item")
    .select("debit, kredit, jurnal!inner(tanggal), akun!inner(kode)")
    .eq("akun.kode", "1200")
    .gte("jurnal.tanggal", startDate)
    .lte("jurnal.tanggal", endDate);

  if (error) throw error;

  let totalDibeli = 0;
  let totalTerjual = 0;
  for (const row of data) {
    totalDibeli += Number(row.debit) || 0;
    totalTerjual += Number(row.kredit) || 0;
  }

  return {
    totalDibeli,
    totalTerjual,
    sisa: totalDibeli - totalTerjual,
  };
}

export { AKUN_KODE, KATEGORI_TO_AKUN };
