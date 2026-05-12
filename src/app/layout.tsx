import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { AuthProvider } from "@/components/providers/auth-provider";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { siteUrl } from "@/lib/utils";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? ""),
  title: {
    default: "FrontendAce — Ace your frontend interview",
    template: "%s · FrontendAce",
  },
  description:
    "Curated questions, structured roadmaps, and a clear path from refresher to interview-ready. Practice. Reason. Ship.",
  keywords: [
    "frontend interview",
    "react interview",
    "javascript interview",
    "system design",
    "frontend prep",
    "frontend ace",
    "dsa algorithms",
    "blind 75",
    "web performance",
  ],
  authors: [{ name: "FrontendAce" }],
  openGraph: {
    type: "website",
    url: siteUrl(),
    siteName: "FrontendAce",
    title: "FrontendAce — Ace your frontend interview",
    description:
      "Curated questions, structured roadmaps, and a clear path from refresher to interview-ready.",
  },
  twitter: {
    card: "summary_large_image",
    title: "FrontendAce",
    description: "Curated questions and structured roadmaps for frontend interviews.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafaf7" },
    { media: "(prefers-color-scheme: dark)", color: "#08080a" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body className="min-h-screen bg-background font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <div className="relative flex min-h-screen flex-col">
              <SiteHeader />
              <main className="flex-1">{children}</main>
              <SiteFooter />
            </div>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
