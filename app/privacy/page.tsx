import React from "react";
import Link from "next/link";
import { Shield, Lock, HardDrive, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Kebijakan Privasi — ClosedBook",
  description: "Prinsip Zero-Server-Retention dan perlindungan data Google Drive di ClosedBook Production OS.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-neutral-200">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <Link
          href="/workspace"
          className="mb-8 inline-flex items-center gap-2 text-sm text-neutral-400 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Workspace
        </Link>

        <header className="mb-12">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#FF2A4D]/30 bg-[#FF2A4D]/10 px-3 py-1 text-xs font-semibold tracking-wider text-[#FF2A4D] uppercase">
            <Shield className="h-3.5 w-3.5" />
            Privasi & Kedaulatan Data
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Kebijakan Privasi ClosedBook
          </h1>
          <p className="mt-3 text-neutral-400">
            Terakhir diperbarui: 23 September 2026 • Versi 1.0 (Zero-Server-Retention)
          </p>
        </header>

        <section className="space-y-8 text-neutral-300">
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-white">
              <HardDrive className="h-5 w-5 text-[#FF2A4D]" />
              1. Prinsip Zero-Server-Retention (BYOS)
            </h2>
            <p className="leading-relaxed text-neutral-400">
              ClosedBook beroperasi dengan model <strong className="text-white">Bring Your Own Storage (BYOS)</strong>.
              Kami tidak memiliki basis data terpusat yang menyimpan file produksi, anggaran, transaksi kas, ataupun catatan syuting Anda.
              Seluruh data hidup secara lokal di perangkat Anda (IndexedDB) dan disinkronkan langsung ke akun Google Drive pribadi Anda.
            </p>
          </div>

          <div>
            <h2 className="mb-3 text-xl font-semibold text-white">
              2. Penggunaan Google OAuth & Data API (Google User Data Policy)
            </h2>
            <p className="leading-relaxed text-neutral-400">
              ClosedBook meminta izin akses terbatas (least-privilege scope):
            </p>
            <ul className="mt-3 list-inside list-disc space-y-2 text-neutral-400">
              <li>
                <code className="rounded bg-neutral-800 px-2 py-0.5 text-xs text-neutral-200">
                  https://www.googleapis.com/auth/drive.file
                </code>{" "}
                — Digunakan semata-mata untuk membuat, membaca, dan memperbarui folder serta dokumen (Sheets/Docs) yang dibuat oleh aplikasi ClosedBook di Drive Anda. Aplikasi tidak dapat membaca file lain di luar folder ClosedBook.
              </li>
              <li>
                <code className="rounded bg-neutral-800 px-2 py-0.5 text-xs text-neutral-200">openid, email, profile</code>{" "}
                — Digunakan untuk memverifikasi identitas dan menampilkan foto profil di antarmuka workspace.
              </li>
            </ul>
            <p className="mt-3 leading-relaxed text-neutral-400">
              Kami mematuhi secara ketat <strong>Google API Services User Data Policy</strong>, termasuk persyaratan <em>Limited Use</em>. Data Google Anda tidak pernah dijual, tidak ditransfer ke pihak ketiga, dan tidak digunakan untuk melatih model kecerdasan buatan (AI) publik.
            </p>
          </div>

          <div>
            <h2 className="mb-3 text-xl font-semibold text-white">
              3. Kunci API Gemini AI (Model BYOK)
            </h2>
            <p className="leading-relaxed text-neutral-400">
              Untuk fitur AI Vision dan Voice Assistant, ClosedBook menggunakan model <em>Bring Your Own Key</em>.
              Kunci API Anda disimpan secara terenkripsi di perangkat lokal Anda menggunakan enkripsi AES-256-GCM.
              Server ClosedBook tidak pernah menerima atau menyimpan kunci API pribadi Anda.
            </p>
          </div>

          <div>
            <h2 className="mb-3 text-xl font-semibold text-white">
              4. Bebas Pelacak Pihak Ketiga (Zero Third-Party Telemetry)
            </h2>
            <p className="leading-relaxed text-neutral-400">
              ClosedBook tidak menggunakan Google Analytics, Facebook Pixel, maupun pelacak cloud third-party lainnya.
              Log diagnostik kesalahan disimpan di perangkat Anda sendiri (Dexie Error Table) dan tidak pernah dikirim ke server luar tanpa persetujuan eksplisit Anda.
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-white">
              <Lock className="h-5 w-5 text-emerald-400" />
              5. Hak Portabilitas Data & Pemutusan Sesi (GDPR / CCPA)
            </h2>
            <p className="leading-relaxed text-neutral-400">
              Anda memegang kendali penuh atas data Anda kapan pun:
            </p>
            <ul className="mt-3 list-inside list-disc space-y-2 text-neutral-400">
              <li>Ekspor seluruh data dalam format standar ZIP (JSON + CSV) dapat dilakukan secara offline langsung dari perangkat Anda.</li>
              <li>Pemutusan akun Google dapat dilakukan instan via tombol Disconnect di Settings, yang otomatis mencabut token OAuth dan menghapus seluruh sesi aktif.</li>
            </ul>
          </div>
        </section>

        <footer className="mt-16 border-t border-neutral-800 pt-8 text-sm text-neutral-500">
          © 2026 ClosedBook Production OS. Hak cipta dilindungi undang-undang.
        </footer>
      </div>
    </div>
  );
}
