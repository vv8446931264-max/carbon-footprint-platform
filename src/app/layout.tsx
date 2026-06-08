import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL =
  "https://carbon-footprint-platform-1053195634368.us-central1.run.app";
const SITE_NAME = "Carbon Coach";
const DESCRIPTION =
  "Understand, track, and reduce your personal carbon footprint. Log activities in plain language or scan a receipt, see your annual pace against a science-based 2-tonne target, and get personalized, AI-powered tips. Private by design: your data stays in your browser.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Carbon Coach: Understand, Track & Reduce Your Footprint",
    template: "%s · Carbon Coach",
  },
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "carbon footprint",
    "carbon footprint calculator",
    "carbon tracker",
    "CO2 emissions",
    "sustainability",
    "climate action",
    "personal carbon budget",
    "reduce emissions",
    "Paris-aligned target",
  ],
  authors: [{ name: "Carbon Coach" }],
  creator: "Carbon Coach",
  category: "sustainability",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: "Carbon Coach: Understand, Track & Reduce Your Footprint",
    description: DESCRIPTION,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Carbon Coach: Understand, Track & Reduce Your Footprint",
    description: DESCRIPTION,
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icon.svg" }],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfaf8" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0a09" },
  ],
  colorScheme: "light dark",
};

/**
 * Runs before paint to set the `.dark` class from the saved preference (or the
 * OS setting in "system" mode), so there's no light-mode flash on load. Kept
 * tiny and dependency-free; mirrors the logic in lib/theme/theme.ts.
 */
const themeScript = `(function(){try{var k="carbon-footprint-theme:v1";var p=localStorage.getItem(k);var d=window.matchMedia("(prefers-color-scheme: dark)").matches;var dark=p==="dark"||((p===null||p==="system")&&d);document.documentElement.classList.toggle("dark",dark);}catch(e){}})();`;

/** schema.org structured data so search engines can show a rich result. */
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: SITE_NAME,
  url: SITE_URL,
  applicationCategory: "LifestyleApplication",
  operatingSystem: "Any (web browser)",
  description: DESCRIPTION,
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
