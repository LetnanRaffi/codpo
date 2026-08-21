import type { Metadata } from "next";
import {
  Big_Shoulders,
  IBM_Plex_Mono,
  Plus_Jakarta_Sans,
} from "next/font/google";
import { MockAuthProvider } from "@/components/providers/mock-auth-provider";
import { RadiusProvider } from "@/components/providers/radius-provider";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const display = Big_Shoulders({
  variable: "--font-display-src",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const sans = Plus_Jakarta_Sans({
  variable: "--font-sans-src",
  subsets: ["latin"],
});

const mono = IBM_Plex_Mono({
  variable: "--font-mono-src",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: {
    default: "CODPO — Barang BU Murah Sekitar Kamu",
    template: "%s · CODPO",
  },
  description:
    "Marketplace lokal buat barang murah dari seller yang lagi BU. Chat, COD langsung, selesai.",
  icons: { icon: "/logo-codpo.png" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={`${display.variable} ${sans.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <MockAuthProvider>
            <RadiusProvider>{children}</RadiusProvider>
          </MockAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
