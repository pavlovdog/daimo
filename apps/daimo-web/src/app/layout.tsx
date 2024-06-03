import type { Metadata, Viewport } from "next";

import "@rainbow-me/rainbowkit/styles.css";
import { neueMontreal } from "../fonts/font";
import "./globals.css";
import { getAbsoluteUrl } from "../utils/getAbsoluteUrl";

export const metadata: Metadata = {
  metadataBase: new URL(getAbsoluteUrl("/")),
  title: "Daimo",
  description: "Stablecoin payments app",
  icons: {
    icon: "/logo-web-favicon.png",
  },
  openGraph: {
    images: [
      {
        url: "/logo-link-preview.png",
        alt: "Daimo",
        width: 128,
        height: 105,
      },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 0.4,
};

function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${neueMontreal.variable} font-sans`}>
      <body>{children}</body>
    </html>
  );
}

export default RootLayout;
