import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { DigitalClock } from "@/components/DigitalClock";
import "./globals.css";

const romVariable = localFont({
  src: "./fonts/rom-variable.woff2",
  weight: "300 900",
  style: "normal",
  variable: "--font-rom",
});

export const metadata: Metadata = {
  title: "FO—WAVE",
  description: "FO—WAVE",
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
    <html lang="en" className={romVariable.variable}>
      <body>
        {children}
        <footer className="page pinned-bottom">
          <div className="page-layout">
            <div className="bodycopy">
              <DigitalClock />
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
