import type { Metadata } from "next";

import { LegalDoc } from "@/components/legal/legal-doc";
import { loadLegalDoc } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Kebijakan Privasi",
  robots: { index: false },
};

export default async function PrivacyPage() {
  const content = await loadLegalDoc("privacy");
  return <LegalDoc content={content} />;
}
