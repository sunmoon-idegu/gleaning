import type { Metadata } from "next";
import { Lora, Noto_Serif_SC } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/theme-provider";
import { I18nProvider } from "@/components/i18n-provider";
import "./globals.css";

const lora = Lora({ subsets: ["latin"], variable: "--font-geist-sans" });
const notoSerifSC = Noto_Serif_SC({ subsets: ["latin"], weight: ["300", "400"], variable: "--font-noto-serif-sc" });

export const metadata: Metadata = {
  title: {
    default: "Gleaning",
    template: "%s · Gleaning",
  },
  description: "Gleaning is a quote-saving app. Take a photo, draw a box around the text, and it's saved in seconds. No typing. Available on iPhone and the web.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning className={`${lora.variable} ${notoSerifSC.variable}`}>
        <body className="min-h-screen bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-sans antialiased">
          <ThemeProvider><I18nProvider>{children}</I18nProvider></ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
