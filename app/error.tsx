"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application runtime error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#050505] text-[#fdfdfd] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-12 h-12 rounded-full bg-[#ff1e42]/10 border border-[#ff1e42]/20 flex items-center justify-center mb-6">
        <AlertCircle className="w-6 h-6 text-[#ff1e42]" />
      </div>
      <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mb-2">Production Runtime Interrupted</h1>
      <p className="text-sm text-[#a3a3a3] max-w-md mb-8">
        An unexpected error occurred in the ledger state. Your local data remains safely cached.
      </p>
      <button
        onClick={() => reset()}
        className="btn-primary-crimson text-xs font-medium py-2.5 px-5 flex items-center gap-2"
      >
        <RefreshCw className="w-4 h-4" />
        Attempt Recovery
      </button>
    </div>
  );
}
