import React from "react";
import Link from "next/link";
import { FileText, ArrowLeft, CheckCircle2 } from "lucide-react";

export const metadata = {
  title: "Syarat & Ketentuan Layanan — ClosedBook",
  description: "Syarat dan ketentuan penggunaan ClosedBook Production OS.",
};

export default function TermsPage() {
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
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-neutral-700 bg-neutral-800/60 px-3 py-1 text-xs font-semibold tracking-wider text-neutral-300 uppercase">
            <FileText className="h-3.5 w-3.5" />
            Ketentuan Layanan
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Syarat & Ketentuan Layanan
          </h1>
          <p className="mt-3 text-neutral-400">
            Terakhir diperbarui: 23 September 2026 • ClosedBook Production OS
          </p>
        </header>

        <section className="space-y-8 text-neutral-300">
          <div>
            <h2 className="mb-3 text-xl font-semibold text-white">
              1. Penerimaan Ketentuan
            </h2>
            <p className="leading-relaxed text-neutral-400">
              Dengan mengakses dan menggunakan ClosedBook, Anda menyetujui untuk terikat oleh syarat dan ketentuan ini.
              Jika Anda tidak menyetujui ketentuan ini, mohon untuk tidak menggunakan layanan ini.
            </p>
          </div>

          <div>
            <h2 className="mb-3 text-xl font-semibold text-white">
              2. Kedaulatan & Kepemilikan Data Pengguna
            </h2>
            <p className="leading-relaxed text-neutral-400">
              Anda memegang kepemilikan mutlak atas seluruh konten, lembar kerja, anggaran, dan file media yang Anda kelola melalui ClosedBook.
              ClosedBook tidak mengklaim hak kepemilikan atas dokumen produksi Anda di Google Drive.
            </p>
          </div>

          <div>
            <h2 className="mb-3 text-xl font-semibold text-white">
              3. Tanggung Jawab Penggunaan Layanan Pihak Ketiga
            </h2>
            <p className="leading-relaxed text-neutral-400">
              Penggunaan ClosedBook melibatkan integrasi dengan API pihak ketiga (Google Drive API, Google Sheets API, Google Docs API, dan Google Gemini API).
              Anda bertanggung jawab atas kepatuhan terhadap kuota dan kebijakan penggunaan akun Google Anda sendiri.
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-white">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              4. Batasan Tanggung Jawab
            </h2>
            <p className="leading-relaxed text-neutral-400">
              ClosedBook disediakan &ldquo;sebagaimana adanya&rdquo; (<em>as is</em>) tanpa jaminan ketiadaan gangguan konektivitas lokal atau jaringan pihak ketiga.
              Sistem telah dilengkapi dengan arsitektur Offline-First IndexedDB dan pencadangan otomatis ke Google Drive untuk meminimalkan risiko kehilangan data di lapangan produksi.
            </p>
          </div>
        </section>

        <footer className="mt-16 border-t border-neutral-800 pt-8 text-sm text-neutral-500">
          © 2026 ClosedBook Production OS. Hak cipta dilindungi undang-undang.
        </footer>
      </div>
    </div>
  );
}
