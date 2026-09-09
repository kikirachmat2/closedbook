import Link from "next/link";
import { ArrowLeft, AlertTriangle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#050505] text-[#fdfdfd] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-12 h-12 rounded-full bg-[#ff1e42]/10 border border-[#ff1e42]/20 flex items-center justify-center mb-6">
        <AlertTriangle className="w-6 h-6 text-[#ff1e42]" />
      </div>
      <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-2">404 — Ledger Not Found</h1>
      <p className="text-sm text-[#a3a3a3] max-w-md mb-8">
        The production workspace or document you are looking for does not exist or has been archived.
      </p>
      <div className="flex items-center gap-3">
        <Link
          href="/workspace"
          className="btn-primary-crimson text-xs font-medium py-2.5 px-5"
        >
          <ArrowLeft className="w-4 h-4" />
          Return to Workspace
        </Link>
        <Link
          href="/"
          className="btn-ghost-pill text-xs font-medium py-2.5 px-5"
        >
          Landing Page
        </Link>
      </div>
    </div>
  );
}
