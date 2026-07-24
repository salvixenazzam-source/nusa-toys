const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const env = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/);
const anonMatch = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/);

if (!urlMatch || !anonMatch) {
  console.log('ERROR: Could not find Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(urlMatch[1].trim(), anonMatch[1].trim());

(async () => {
  // Check diskon table
  const { data, error } = await supabase.from('diskon').select('id').limit(1);
  if (error) {
    console.log(`TABLE 'diskon': MISSING — ${error.message} (${error.code})`);
  } else {
    console.log(`TABLE 'diskon': READY (${data.length} rows)`);
  }

  // Check diskon_kategori
  const { error: err2 } = await supabase.from('diskon_kategori').select('diskon_id').limit(1);
  if (err2) {
    console.log(`TABLE 'diskon_kategori': MISSING — ${err2.message}`);
  } else {
    console.log(`TABLE 'diskon_kategori': READY`);
  }

  // Check diskon_produk
  const { error: err3 } = await supabase.from('diskon_produk').select('diskon_id').limit(1);
  if (err3) {
    console.log(`TABLE 'diskon_produk': MISSING — ${err3.message}`);
  } else {
    console.log(`TABLE 'diskon_produk': READY`);
  }

  // Check penjualan has discount columns
  const { data: colData, error: err4 } = await supabase.from('penjualan').select('diskon_id, diskon_nilai, hemat').limit(1);
  if (err4) {
    console.log(`COLUMNS 'penjualan.diskon_id/nilai/hemat': MISSING — ${err4.message}`);
  } else {
    console.log(`COLUMNS 'penjualan.diskon_id/nilai/hemat': READY`);
  }
})();
