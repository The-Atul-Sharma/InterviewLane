import type { Metadata, Viewport } from "next";
import Script from "next/script";
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
    default: "InterviewLane — Ace your frontend interview",
    template: "%s · InterviewLane",
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
  authors: [{ name: "InterviewLane" }],
  openGraph: {
    type: "website",
    url: siteUrl(),
    siteName: "InterviewLane",
    title: "InterviewLane — Ace your frontend interview",
    description:
      "Curated questions, structured roadmaps, and a clear path from refresher to interview-ready.",
  },
  twitter: {
    card: "summary_large_image",
    title: "InterviewLane",
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
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "InterviewLane",
    url: siteUrl(),
    description: "Curated questions, structured roadmaps, and a clear path from refresher to interview-ready.",
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl()}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

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

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        {gaId && (
          <>
            <Script
              strategy="afterInteractive"
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            />
            <Script
              id="google-analytics"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${gaId}', {
                    page_path: window.location.pathname,
                  });
                `,
              }}
            />
          </>
        )}
      </body>
    </html>
  );
}
