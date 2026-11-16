import type { Metadata, Viewport } from "next";
import { Inter, Manrope, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin"] });
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "LifeArchive", template: "%s · LifeArchive" },
  description: "Capture. Remember. Live More. Your private home for memories.",
};

export const viewport: Viewport = {
  themeColor: "#080a20",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${manrope.variable} ${jakarta.variable}`}
    >
      <body className="min-h-dvh bg-ambient">{children}</body>
    </html>
  );
}
