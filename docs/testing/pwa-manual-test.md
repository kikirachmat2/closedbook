# ClosedBook PWA Manual Testing Protocol (iOS & Android)

Panduan pengujian manual Progressive Web App (PWA) ClosedBook pada perangkat fisik nyata (real devices) untuk verifikasi Sub-Fase G.2.

---

## 1. Lingkungan Pengujian
- **iOS Device**: iPhone 13/14/15/16 Pro running iOS 16.4+ (Safari Mobile)
- **Android Device**: Google Pixel / Samsung Galaxy running Android 13+ (Chrome Mobile)
- **Local Testing URL**: `https://<local-ip>:3000` (atau tunneling via Cloudflare Tunnel / ngrok dengan SSL aktif)

---

## 2. Checklist Pengujian iOS (Safari Mobile)

| ID | Item Uji | Prosedur | Kriteria Lolos (Pass) |
|---|---|---|---|
| **IOS-01** | Manifest & Icon Detection | Buka URL di Safari Mobile. Periksa metadata source. | Ikon 180x180 `apple-touch-icon-180.png` dan theme-color `#050505` terdeteksi. |
| **IOS-02** | Install Prompt Guidance | Selesaikan onboarding atau navigasi 5 detik di workspace. | Bottom sheet / banner `IOSInstallPrompt` muncul dengan instruksi: Tap tombol Share $\rightarrow$ "Add to Home Screen". |
| **IOS-03** | Standalone Mode Launch | Buka app dari Home Screen icon. | Aplikasi berjalan fullscreen tanpa URL bar Safari (`navigator.standalone === true`). Status bar warna hitam (`black-translucent`). |
| **IOS-04** | Offline Resilience | Aktifkan Airplane Mode, tutup app, dan buka kembali. | App shell langsung terbuka dari Cache Storage Service Worker. Data Dexie lokal dapat dibaca tanpa sambungan internet. Banner sticky offline muncul. |
| **IOS-05** | Service Worker Update | Trigger update SW versi baru. Buka app. | Banner `UpdatePrompt` muncul: *"Versi baru tersedia — Muat Ulang"*. Klik Muat Ulang $\rightarrow$ `skipWaiting` terpanggil, halaman refresh ke versi baru. |

---

## 3. Checklist Pengujian Android (Google Chrome)

| ID | Item Uji | Prosedur | Kriteria Lolos (Pass) |
|---|---|---|---|
| **AND-01** | Web App Manifest Validity | Buka URL di Chrome Mobile. Periksa menu titik tiga. | Menu "Install app" / "Tambahkan ke Layar Utama" aktif dan valid. |
| **AND-02** | Native Install Prompt | Event `beforeinstallprompt` tertangkap oleh `PwaManager`. | Tombol install atau native prompt Chrome muncul. Klik install $\rightarrow$ PWA terpasang ke App Drawer. |
| **AND-03** | Splash Screen & Theme | Buka PWA terpasang dari App Drawer. | Splash screen warna `#050505` dengan icon maskable 512px muncul sejenak, lalu transisi halus ke app shell. |
| **AND-04** | Offline Simulation | Aktifkan Airplane Mode. Buat catatan/transaksi dummy. | Data tersimpan ke IndexedDB lokal. Sticky offline banner menyala: *"Kamu offline. Perubahan akan disinkronkan saat online."* |
| **AND-05** | Reconnection & Background Sync | Matikan Airplane Mode (kembali online). | Sticky banner hilang. Indikator sync berputar sejenak $\rightarrow$ sukses checklist hijau. Event background sync atau `visibilitychange` mengeksekusi antrean mutasi. |
| **AND-06** | Cold-Start Restore Simulation | Buka Developer Tools $\rightarrow$ Application $\rightarrow$ Clear Storage (IndexedDB). Buka kembali app. | `detectAndRestoreColdStart()` mendeteksi data lokal kosong dan sesi login aktif $\rightarrow$ memicu restore backup dari Drive. Toast "Data dipulihkan dari Drive Backup" muncul. |

---

## 4. Emergency Kill-Switch Protocol

Jika terjadi Service Worker buggy / caching loop di production:
1. Hit endpoint `/api/sw/kill` melalui browser atau HTTP client.
2. Endpoint mengembalikan header HTTP:
   ```http
   Clear-Site-Data: "cache", "storage"
   ```
3. Browser klien otomatis mengosongkan SW cache dan me-reset Service Worker registration pada reload berikutnya.
