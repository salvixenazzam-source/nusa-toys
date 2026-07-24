# 🖥️ Proxmox — Virtualisasi Jadi Mudah!
## Panduan Sederhana untuk Pemula

---

## 🤔 Proxmox Itu Apa?

**Proxmox VE** (Virtual Environment) adalah software yang **mengubah 1 komputer fisik jadi banyak komputer virtual**.

```
┌─────────────── SATU SERVER FISIK ───────────────┐
│              ┌─ PROXMOX ──────────────┐         │
│              │                        │         │
│  ┌─── VM 1 ──┐  ┌─── VM 2 ──┐  ┌─ LXC ─┐      │
│  │ Windows   │  │ Ubuntu    │  │ Nginx │      │
│  │ 4GB RAM   │  │ 2GB RAM   │  │ 512MB │      │
│  │ 50GB Disk │  │ 20GB Disk │  │ 5GB   │      │
│  └───────────┘  └───────────┘  └───────┘      │
│              └────────────────────────┘         │
└─────────────────────────────────────────────────┘
```

### Analogi Sederhana

- **Proxmox** = Kos-kosan (1 bangunan, banyak kamar)
- **VM (Virtual Machine)** = Kamar kos (setiap kamar punya pintu sendiri)
- **LXC Container** = Apartemen studio (lebih ringan, pakai dapur bersama)
- **Hypervisor** = Tukang kos yang ngatur semua kamar
- **Host** = Server fisiknya
- **Guest** = VM / container yang jalan di atasnya

---

## 🏗️ Dua Tipe: VM vs Container

| Aspek | VM (Virtual Machine) | LXC Container |
|-------|---------------------|---------------|
| **OS** | Punya OS sendiri (Windows/Linux apapun) | Pakai kernel host (Linux aja) |
| **Berat** | Berat (pakai resource sendiri) | Ringan |
| **Boot** | 1-3 menit | 1-5 detik! |
| **Guna** | Butuh OS berbeda / Windows | Web server, database, aplikasi |
| **Isolasi** | **Sangat aman** (full terisolasi) | Cukup aman |
| **Resource** | Makan RAM & CPU lebih | Efisien, bisa 20+ container |

> **Aturan praktis:** Kalau butuh Windows → VM. Kalau cuma Linux app → LXC. 🎯

---

## 🔧 Instalasi Proxmox

### Spesifikasi Minimum

| Komponen | Minimal | Rekomendasi |
|----------|---------|-------------|
| CPU | 64-bit, 2 core | 4+ core |
| RAM | 4 GB | 8-16 GB |
| Storage | 50 GB SSD | 256 GB+ SSD |
| Network | 1 NIC | 2 NIC (satu untuk management) |

### Langkah Instalasi (Singkat)

1. Download ISO dari https://proxmox.com/downloads
2. Flash ke USB (pake Rufus / balenaEtcher)
3. Boot dari USB
4. Ikuti wizard:
   - Pilih hardisk
   - Set password `root`
   - Set IP management (contoh: `192.168.1.100/24`)
5. Selesai! Akses via browser: `https://192.168.1.100:8006`

---

## 🎛️ Dashboard Proxmox — Penjelasan Tombol Penting

```
┌──────────────────────────────────────────────────┐
│  PROXMOX VE — 192.168.1.100:8006                │
├──────────┬───────────────────────────────────────┤
│          │                                       │
│ ⬡ pve01  │  ◉ Server (pve01)                     │
│  ├─ VM 100│    Status: ● Running                  │
│  │ Ubuntu │    CPU: 23%  RAM: 6.8/15.6 GB       │
│  ├─ VM 101│    Uptime: 14 days                   │
│  │ Windows│                                       │
│  ├─ CT 200│  ── Menu Penting ────                 │
│  │ Nginx  │  [Shell]  Terminal langsung           │
│  │        │  [System] Reboot, shutdown, update    │
│  │        │  [Network] Setting IP & DNS           │
│  │        │  [Disks] Storage & backup             │
│  │        │                                       │
│  └────────│  ── Tombol Biru ────                  │
│           │  [Create VM]   [Create CT]             │
└───────────┴───────────────────────────────────────┘
```

---

## 🖥️ Cara Buat VM Pertama (Linux)

### Langkah 1: Upload ISO
```
Server → local (storage) → ISO Images → Upload
```
Upload file ISO Ubuntu/Debian.

### Langkah 2: Create VM
Klik tombol **"Create VM"** — isi:

| Step | Isian | Contoh |
|------|-------|--------|
| **General** | VM ID + Nama | ID: `100`, Nama: `web-server` |
| **OS** | Pilih ISO | ISO yang tadi diupload |
| **System** | BIOS + SCSI | Default aja |
| **Disk** | Ukuran disk | `20 GB` |
| **CPU** | Jumlah core | `2` core |
| **Memory** | RAM | `2048` MB (2 GB) |
| **Network** | Bridge | `vmbr0` (biasanya default) |
| **Confirm** | Finish | ✅ |

### Langkah 3: Start & Install
1. Klik kanan VM → **Start**
2. Klik **"Console"** — lihat layar instalasi
3. Install OS seperti biasa di dalam VM!

---

## 📦 Container (LXC) — Lebih Cepat!

Container lebih **ringan & cepat** — cocok buat WordPress, Nginx, Database.

### Cara Buat Container

1. **Download template dulu:**
   ```
   Server → local (storage) → CT Templates → Templates → Pilih "ubuntu-22.04-standard"
   ```

2. **Create CT:**
   Klik **"Create CT"** → isi:
   - Password / SSH key
   - Template: pilih yg tadi didownload
   - Disk: `8 GB`
   - CPU: `2` core
   - RAM: `1024` MB
   - Network: `dhcp`

3. **Selesai!** Container siap dalam **5 detik** 🚀

### Cara Masuk Container
```bash
# Dari shell Proxmox
pct enter 200   # 200 = CT ID
```

Atau SSH langsung ke IP container.

---

## 🧩 Fitur-Fitur Keren Proxmox

### 1. Snapshot — Tombol "Save Game"

Mirip **save game** — sebelum update/config, tinggal snapshot, kalau error bisa balik!

```bash
# Cara CLI
qm snapshot 100 pre-update   # VM
pct snapshot 200 pre-update  # CT
```

Atau lewat UI: Klik VM → Snapshots → Take Snapshot.

### 2. Backup — Jangan Pernah Lupa!

**Otomatis** bisa dijadwalkan:
```
Datacenter → Backup → Add
```
- Set jadwal: setiap hari jam 02:00
- Simpan di storage
- Backup mode: **Stop** (paling aman)

### 3. Template Clone — VM Siap Pakai

Buat 1 VM template (OS + basic tools), clone ke banyak VM.

```
VM → Convert to Template → Clone
```
Buat lab praktikum: 20 VM dalam 10 menit! ⚡

### 4. Cluster — Gabung Beberapa Server

```
Datacenter → Cluster → Create Cluster
```
Di server lain: `pvecm add 192.168.1.100`

| Manfaat Cluster | |
|----------------|-|
| ✅ **Migrasi live** — pindah VM tanpa mati |
| ✅ **Satu dashboard** — kelola semua server |
| ✅ **HA (High Availability)** — auto restart kalau server mati |

---

## 🔥 Skenario Praktis

### Skenario 1: Lab Belajar Jaringan

```
┌─── SERVER PROXMOX ─────────────────┐
│                                     │
│  VM 101: MikroTik CHR              │
│  VM 102: Ubuntu + Web Server       │
│  VM 103: Ubuntu + Database         │
│  VM 104: Client / Testing          │
│  CT 200: DNS Server (LXC)          │
│                                     │
└─────────────────────────────────────┘
```

Di dalam Proxmox, jaringan virtual bisa diatur pakai bridge, VLAN, dll.

### Skenario 2: Hosting Web Mini

```
INTERNET ──► PROXMOX ──► CT 201: Nginx (reverse proxy)
                           ├── VM 110: WordPress
                           ├── CT 202: PostgreSQL
                           └── CT 203: Redis cache
```

Setiap aplikasi terisolasi, bisa direstart sendiri tanpa ganggu yang lain.

### Skenario 3: Server Sekolah

| VM/CT | Guna | RAM |
|-------|------|-----|
| CT 101 | Login page / SSO | 1 GB |
| CT 102 | Website sekolah | 1 GB |
| VM 201 | Database server | 4 GB |
| VM 202 | File server (Samba) | 2 GB |
| CT 103 | DNS caching | 512 MB |

**Total: 1 server fisik untuk semua kebutuhan!**

---

## 📋 Cheatsheet Perintah Penting

| Perintah | Guna |
|----------|------|
| `qm list` | Lihat semua VM |
| `pct list` | Lihat semua container |
| `qm start 100` | Start VM ID 100 |
| `qm stop 100` | Stop VM |
| `qm reboot 100` | Restart VM |
| `pct enter 200` | Masuk ke container 200 |
| `qm snapshot 100 nama` | Snapshot VM |
| `qm rollback 100 nama` | Balikin ke snapshot |
| `pvesh get /nodes/pve01/status` | Status server API |
| `df -h` | Cek storage |
| `journalctl -xe` | Lihat log error |

---

## 🚨 Masalah Umum & Solusi

| Masalah | Penyebab | Solusi |
|---------|----------|--------|
| Gak bisa akses web UI | Firewall blokir port 8006 | `iptables -A INPUT -p tcp --dport 8006 -j ACCEPT` |
| VM lambat banget | Overcommit RAM kebanyakan | Kurangi VM yang jalan |
| Storage penuh | Snapshot numpuk | Hapus snapshot lama |
| Gagal start VM | Lock file | `qm unlock 100` |
| Bridge error | Konfig network | Cek `/etc/network/interfaces` |

---

## 💡 Tips dari Praktisi

1. **Backup sebelum update** — snapshot dulu sebelum `apt upgrade`
2. **Gunakan SSD** — performa Proxmox jauh lebih baik
3. **Pisahkan storage OS & VM** — OS di SSD, VM di HDD/another disk
4. **Buat satu VM template** — install Ubuntu minimal, update, jadikan template
5. **Watch RAM** — jangan jalanin semua VM sekaligus kalau RAM terbatas
6. **Coba di VirtualBox dulu** — install Proxmox di VM buat latihan

> ⚠️ **Proxmox harus diinstall langsung di server fisik** — bukan di dalam OS lain!

---

## 🌐 Referensi Belajar

| Sumber | Link |
|--------|------|
| Dokumentasi Resmi | https://pve.proxmox.com/wiki |
| Forum Proxmox | https://forum.proxmox.com |
| YouTube: Proxmox Tutorial | https://youtube.com/@proxmox |
| Proxmox VE Admin Guide | https://pve.proxmox.com/pve-docs/ |

---

> 🎯 **Target**: Paham konsep virtualisasi, bisa install Proxmox, bikin VM & container, manage backup.

---

*Selamat belajar virtualisasi! 🖥️*
