import type { Metadata, Viewport } from "next";
import { Source_Serif_4 } from "next/font/google";
import { DigitalClock } from "@/components/DigitalClock";
import { introStorageKey } from "@/lib/intro";
import "./globals.css";

const serif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

const skipSeenIntro = `try{if(sessionStorage.getItem("${introStorageKey}"))document.documentElement.dataset.intro="done"}catch(e){}`;

export const metadata: Metadata = {
  title: "FO—WAVE",
  description: "FO—WAVE Issue One",
  openGraph: {
    title: "FO—WAVE",
    url: "https://fo-wave.online",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FO—WAVE",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={serif.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: skipSeenIntro }} />
      </head>
      <body>
        {children}
        <footer className="site-footer">
          <DigitalClock />
        </footer>
      </body>
    </html>
  );
}
