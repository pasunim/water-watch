import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Prompt } from "next/font/google";
import { BRAND } from "@/lib/brand";
import "./globals.css";

const prompt = Prompt({
  variable: "--font-prompt",
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["500", "600"],
});

export const metadata: Metadata = {
  title: `${BRAND.name} — ${BRAND.tagline}`,
  description: BRAND.description,
  authors: [{ name: BRAND.author, url: BRAND.authorUrl }],
  creator: BRAND.author,
};

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#f7f5f0",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="th" className={`${prompt.variable} ${jetbrains.variable} h-full`}>
      <body className="min-h-full flex flex-col font-sans antialiased">{children}</body>
    </html>
  );
}
