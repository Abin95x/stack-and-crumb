import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, DM_Sans, Instrument_Serif } from "next/font/google";
import "lenis/dist/lenis.css";
import "./globals.css";
import Bag from "@/components/Bag";
import SmoothScroll from "@/components/SmoothScroll";
import { CartProvider } from "@/lib/cart";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  axes: ["wdth", "opsz"],
});

const instrument = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: "400",
  // Only the italic cut is used (the .accent style).
  style: "italic",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Stack & Crumb — Burgers & long rolls, built layer by layer",
  description:
    "Smashed burgers and crackly long rolls in Kochi, stacked by hand. Bread baked before sunrise, pickles brined in-house, everything built to order.",
};

export const viewport: Viewport = {
  themeColor: "#15231a",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: extensions (ColorZilla, Grammarly…) inject attributes on
    // <html>/<body> before React hydrates. This only ignores attribute diffs on these two tags.
    <html
      lang="en"
      className={`${bricolage.variable} ${instrument.variable} ${dmSans.variable} antialiased`}
      suppressHydrationWarning
    >
      <body suppressHydrationWarning>
        <SmoothScroll />
        <CartProvider>
          {children}
          <Bag />
        </CartProvider>
      </body>
    </html>
  );
}
