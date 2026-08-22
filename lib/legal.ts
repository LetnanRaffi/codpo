import { readFile } from "node:fs/promises";
import path from "node:path";

const DOCS = {
  terms: "tos-codpo-draft (copy 1).md",
  privacy: "privacy-policy-codpo-draft (copy 1).md",
} as const;

export type LegalDocKey = keyof typeof DOCS;

// ponytail: baca live dari file draft di repo root — edit draft → rebuild → halaman ikut.
// Kalau file dipindah/direname, update DOCS di sini.
export async function loadLegalDoc(key: LegalDocKey): Promise<string> {
  return readFile(
    path.join(/* turbopackIgnore: true */ process.cwd(), DOCS[key]),
    "utf8",
  );
}
