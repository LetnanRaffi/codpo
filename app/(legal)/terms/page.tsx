import type { Metadata } from "next";

import { LegalDoc } from "@/components/legal/legal-doc";
import { loadLegalDoc } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Syarat & Ketentuan",
  robots: { index: false },
};

export default async function TermsPage() {
  const content = await loadLegalDoc("terms");
  return <LegalDoc content={content} />;
}
