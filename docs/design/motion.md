# ClosedBook Motion & Interaction Guidelines (G.3)

Prinsip pergerakan dan micro-animation untuk ClosedBook Production OS.

---

## 1. Filosofi Gerak: Snappy & Purposeful

ClosedBook adalah sistem operasi produksi film/lapangan profesional, bukan aplikasi consumer santai. Pergerakan antarmuka harus **cepat, tegas, dan tidak membuang waktu**:
- Tidak menggunakan animasi berdurasi lambat ($> 350\text{ms}$).
- Menggunakan kurva easing elastis teredam: `cubic-bezier(0.16, 1, 0.3, 1)`.

---

## 2. Token Durasi Gerak

| Token | Durasi | Penggunaan |
|---|---|---|
| `--cb-motion-instant` | `100ms` | Efek hover tombol, status checkbox, color shift |
| `--cb-motion-quick` | `180ms` | Tombol aktif scale (`0.98`), tooltip fade, toast slide |
| `--cb-motion-normal` | `240ms` | Buka/tutup modal dialog, tab switches, dropdowns |
| `--cb-motion-slow` | `320ms` | Transisi halaman, bottom sheet slide up dari layar bawah |

---

## 3. Aksesibilitas (`prefers-reduced-motion`)

ClosedBook menghormati preferensi pengguna: jika `prefers-reduced-motion: reduce` aktif di OS, seluruh durasi otomatis dinonaktifkan atau digantikan dengan *instant cut* tanpa pergeseran posisi.
