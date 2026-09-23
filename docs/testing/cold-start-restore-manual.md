# ClosedBook Cold-Start Drive Restore Manual Test Protocol

Dokumen ini adalah protokol pengujian manual untuk **Cold-Start Restore dari Google Drive** setelah [BLOCKER-001](file:///Users/kiki/Documents/Web%20Develop/ClosedBook/docs/blockers/BLOCKER-001-real-google-oauth-credentials.md) (Google Cloud OAuth credentials) dinyatakan **CLEARED**.

---

## 1. Latar Belakang & Keterbatasan MSW

Pada Sub-Fase G.2, logika restore diverifikasi menggunakan MSW (Mock Service Worker) dan unit test dengan simulasi latensi jaringan (250ms). Namun, pada lingkungan nyata:
- **Google Drive v3 API Latency**: Rata-rata 200–500ms per panggilan HTTP REST.
- **Delta Scaling**: Jika sebuah proyek memiliki 50 file delta terakumulasi sebelum pemadatan (compaction), total waktu download bertahap bisa mencapai 10–25 detik.
- **Progressive Hydration Solusi**: ClosedBook memecah restore menjadi 3 fase progresif agar pengguna dapat segera melihat nama proyek dan anggaran tanpa harus menunggu seluruh ribuan tugas/item logistik selesai diunduh.

---

## 2. Prasyarat Pengujian (Post-BLOCKER-001)

1. Akun Google aktif dengan kredensial OAuth riil di `.env.local`.
2. Proyek uji ClosedBook yang telah memiliki backup di Google Drive:
   - Folder: `/ClosedBook/Test Project/`
   - Berkas: `.sync/manifest.json`, snapshot, dan minimal 3 file `.delta`.
3. Perangkat penguji: Browser Chrome / Safari dengan akses DevTools.

---

## 3. Langkah Pengujian Manual Step-by-Step

### Langkah 1: Bersihkan Data Lokal (Simulasi Cold-Start)
1. Buka browser dan arahkan ke `http://localhost:3000/workspace`.
2. Buka Chrome DevTools $\rightarrow$ tab **Application** $\rightarrow$ **Storage**.
3. Centang **IndexedDB** dan klik **Clear site data**.
4. Verifikasi bahwa database `ClosedBookDB` kosong atau terhapus.

### Langkah 2: Muat Ulang & Observasi Progressive Hydration
1. Refresh halaman `/workspace`.
2. Amati siklus pemulihan progresif 3 fase:
   - **Fase 1 (0–30%)**: Indikator status menampilkan *"Fase 1: Memulihkan Metadata Proyek..."*. Nama proyek, ID, dan mata uang langsung ter-render di app shell.
   - **Fase 2 (30–65%)**: Indikator menampilkan *"Fase 2: Memulihkan Rekening & Transaksi..."*. Rekening kas dan transaksi terakhir muncul di ledger.
   - **Fase 3 (65–100%)**: Indikator menampilkan *"Fase 3: Memulihkan Tugas & Operasional..."*. Seluruh daftar tugas di-populate ke IndexedDB.
3. Toast sukses muncul: *"Data dipulihkan dari Drive Backup"*.

### Langkah 3: Pengukuran Benchmark Latensi Riil
Catat metrik berikut:
- **T1 (Time to First Shell Interaction)**: Waktu dari refresh hingga nama proyek muncul (Target: $< 1.5\text{ detik}$).
- **T2 (Time to Financial Slice)**: Waktu hingga total budget & cashflow aktif (Target: $< 3.5\text{ detik}$).
- **T3 (Full Project Hydration)**: Waktu hingga seluruh delta selesai di-apply (Target: $< 8\text{ detik}$ untuk $\le 20$ deltas).

---

## 4. Troubleshooting & Fallback
- Jika token OAuth kedaluwarsa saat restore: silent refresh via `/api/auth/google/refresh` wajib berjalan otomatis.
- Jika folder `.sync` tidak ditemukan: app shell beralih ke state inisialisasi proyek baru (tidak me-reset atau error unhandled).
