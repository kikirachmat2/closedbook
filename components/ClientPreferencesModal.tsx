"use client";

import dynamic from "next/dynamic";

const PreferencesModal = dynamic(() => import("@/components/PreferencesModal"), {
  ssr: false,
});

export default function ClientPreferencesModal() {
  return <PreferencesModal />;
}
