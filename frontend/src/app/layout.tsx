import type { Metadata } from "next";
import { Lora, Noto_Serif_SC } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const lora = Lora({ subsets: ["latin"], variable: "--font-geist-sans" });
const notoSerifSC = Noto_Serif_SC({ subsets: ["chinese-simplified"], weight: ["300", "400"], variable: "--font-noto-serif-sc" });

export const metadata: Metadata = {
  title: {
    default: "Quote",
    template: "%s · Quote",
  },
  description: "Capture and recall beautiful sentences",
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
          <ThemeProvider>{children}</ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
