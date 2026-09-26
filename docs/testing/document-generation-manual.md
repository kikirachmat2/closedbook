# ClosedBook — Panduan Pengujian Manual Pembuatan Dokumen (Document Generation Manual Test Plan)

**Versi**: v0.6.1  
**Target Perangkat**: Perangkat Nyata (iOS Safari, Android Chrome, Desktop Browser)  
**Lingkungan**: Production (`https://closedbook.vercel.app/workspace`)  
**Prinsip Arsitektur**: Zero-Retention, Kompilasi Biner Sisi Klien (Client-Side In-Memory), Tanpa Transit Server.

---

## 1. Ikhtisar & Tujuan Pengujian

Proses pembuatan dokumen di ClosedBook berjalan sepenuhnya di browser pengguna menggunakan pustaka `exceljs` (untuk file `.xlsx`) dan `docx` (untuk file `.docx`) yang dimuat secara dinamis (*lazy-loaded*).

Pengujian ini memverifikasi:
1. Pemicu aksi FAB (*Floating Action Button*) dengan pembatasan Hukum Hick (maksimum 3 tindakan).
2. Pemilihan templat produksi berbahasa Indonesia:
   - **Buku Kas Produksi** (`.xlsx`)
   - **Call Sheet Harian** (`.docx`)
   - **Laporan Wrap Harian** (`.xlsx`)
3. Kompilasi biner dalam memori dan pratinjau tabel 10 baris pertama di `DocumentPreviewSheet`.
4. Pengunduhan langsung berkas biner ke penyimpanan lokal perangkat.
5. Alur onboarding Google Drive (*non-blocking*, bebas istilah internal `BLOCKER-001`).
6. Mekanisme fallback Web Share API pada peramban non-kompatibel (Firefox/Desktop).
7. Pelacakan dokumen terbaru (*Recent Documents*) di penyimpanan lokal Dexie.js.

---

## 2. Prosedur Pengujian Langkah demi Langkah

### Langkah 1: Persiapan & Navigasi
1. Buka browser di perangkat Anda (Safari di iOS / Chrome di Android / Chrome/Firefox di Desktop).
2. Navigasikan ke URL: `https://closedbook.vercel.app/workspace`.
3. Pastikan halaman dimuat penuh dan bilah navigasi bawah (*Bottom Navigation*) terlihat.

### Langkah 2: Membuka Menu Aksi Dokumen (FAB)
1. Cari tombol FAB merah di pojok kanan bawah layar (ikon `+` atau ikon kontekstual tab).
2. **Tekan dan tahan (Long-Press > 450ms)** tombol FAB.
3. **Verifikasi**: Menu radial muncul dengan maksimal 3 aksi, salah satunya berlabel **"Buat Dokumen"**.
4. Ketuk opsi **"Buat Dokumen"**.

### Langkah 3: Memilih Templat Produksi
1. Bottom sheet **"Buat Dokumen Produksi"** akan terbuka.
2. Tiga templat resmi akan ditampilkan:
   - **Buku Kas Produksi** (Badge `.XLSX`)
   - **Call Sheet Harian** (Badge `.DOCX`)
   - **Laporan Wrap Harian** (Badge `.XLSX`)
3. Ketuk salah satu templat (contoh: **Buku Kas Produksi**).
4. Indikator pemuatan (*spinner*) akan berputar singkat saat pustaka biner diunduh secara *lazy* dan dikompilasi di memori.

### Langkah 4: Verifikasi Pratinjau Dokumen (DocumentPreviewSheet)
1. Lembar pratinjau **DocumentPreviewSheet** terbuka dari bawah.
2. Periksa elemen metadata:
   - Judul dokumen sesuai (misal: "Buku Kas Produksi").
   - Nama berkas biner (contoh: `Buku_Kas_proj-quiet-horizon_2026-09-26T...xlsx`).
   - Ukuran berkas tertera dengan jelas (contoh: `~24 KB` atau `~18 KB`).
   - Label sumber: **Buffer Memori Lokal (Zero-Retention)**.
3. Periksa tabel pratinjau:
   - Menampilkan hingga 10 baris data pertama.
   - Header kolom (Date, Description, Category, Payment Method, Amount, Notes).

### Langkah 5: Mengunduh Berkas Biner
1. Ketuk tombol primer **"Unduh (... KB)"**.
2. **Verifikasi**: Berkas terunduh ke direktori unduhan perangkat.
3. Tombol berubah menjadi centang hijau dengan label **"Berhasil Diunduh"**.
4. Buka berkas yang diunduh menggunakan aplikasi pembaca spreadsheet (Microsoft Excel, Apple Numbers, atau Google Sheets).
   - Pastikan baris 1 terkunci (*frozen row*).
   - Pastikan formula `=SUM(E2:E...)` di kolom Total terhitung otomatis.

### Langkah 6: Pengujian Alur "Simpan ke Drive"
1. Pada `DocumentPreviewSheet`, ketuk tombol sekunder **"Simpan ke Drive"**.
2. **Verifikasi**: Modal onboarding terbuka dengan judul:
   - **"Hubungkan Google Drive"**
   - Pesan: *"Hubungkan akun Google Drive untuk menyimpan dokumen produksi langsung ke folder tim Anda. Dokumen Anda tetap tersimpan aman di perangkat lokal selama belum terhubung."*
   - Tombol: **[Hubungkan Google]** dan **[Nanti Saja]**.
   - Tidak ada istilah internal `BLOCKER-001` yang membingungkan pengguna.
3. Ketuk **[Nanti Saja]** untuk menutup modal tanpa error.

---

## 3. Panduan Pengujian Spesifik Platform

### A. iOS (Safari Mobile)
- **Web Share API**:
  - Ketuk tombol **"Bagikan"** pada `DocumentPreviewSheet`.
  - Sistem iOS Share Sheet bawaan akan muncul dengan opsi AirDrop, Pesan, WhatsApp, Mail, atau Simpan ke Berkas.
- **Penyimpanan Berkas**:
  - Saat mengunduh `.xlsx` atau `.docx`, Safari menampilkan konfirmasi unduhan *"Apakah Anda ingin mengunduh berkas ini?"*.
  - Ketuk *Unduh*, lalu periksa di aplikasi *Files (Berkas)* > *Downloads*.

### B. Android (Chrome Mobile)
- **Download Langsung**:
  - Saat menekan tombol **"Unduh"**, notifikasi download selesai muncul di bilah notifikasi sistem Android.
  - Ketuk notifikasi untuk langsung membuka berkas di Google Sheets atau Docs viewer.
- **Web Share API**:
  - Tombol **"Bagikan"** memicu Android Intent Share Sheet untuk berbagi langsung ke kontak atau aplikasi kerja.

### C. Desktop (Firefox & Chrome)
- **Fallback Web Share API**:
  - Pada Firefox Desktop (yang tidak mendukung `navigator.canShare({ files })`), mengetuk tombol **"Bagikan"** otomatis memicu pengunduhan berkas dan menampilkan toast:
    *"Peramban tidak mendukung berbagi berkas langsung. Dokumen diunduh secara lokal, silakan bagikan secara manual."*

---

## 4. Verifikasi Bagian "Dokumen Produksi Terbaru" (Recent Documents)

1. Setelah membuat dokumen, kembali ke tab **Overview** (atau segarkan halaman).
2. Gulir ke bawah hingga bagian **"Dokumen Produksi Terbaru"**.
3. **Verifikasi**:
   - Kartu dokumen yang baru saja dibuat tercantum dalam daftar.
   - Menampilkan ikon format (`.XLSX` / `.DOCX`), nama dokumen, tanggal/jam pembuatan, dan ukuran berkas.
   - Menekan tombol **"Pratinjau"** pada kartu akan membuka kembali lembar pratinjau dokumen tanpa mengulang kompilasi dari awal.

---

## 5. Matriks Hasil Pengujian Manual

| Skenario Pengujian | Hasil yang Diharapkan | Status | Catatan |
|---|---|---|---|
| FAB Long-press | Menu radial muncul (< 3 opsi, ada "Buat Dokumen") | PASS | Sesuai Hukum Hick & Fitts |
| Template Sheet | Menampilkan 3 opsi berbahasa Indonesia | PASS | Buku Kas, Call Sheet, Wrap Report |
| Kompilasi Excel | Berkas `.xlsx` valid, freeze row 1, SUM formula | PASS | ExcelJS lazy chunk ~250 KB gz |
| Kompilasi Word | Berkas `.docx` valid, tabel adegan dan cast rapi | PASS | docx lazy chunk ~95 KB gz |
| Tombol Simpan ke Drive | Membuka modal onboarding tanpa istilah internal | PASS | Bersih dari BLOCKER-001 |
| Web Share Fallback | Memicu download otomatis di browser non-Share | PASS | Graceful fallback teruji |
| Dexie Recent Docs | Metadata tersimpan dan muncul di tab Overview | PASS | Skema Dexie Version 2 |
