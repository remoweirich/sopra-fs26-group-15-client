import type { Metadata } from "next";
import { Space_Grotesk, IBM_Plex_Mono } from "next/font/google";
import "@/styles/globals.css";
import { WebSocketProvider } from "@/context/WebSocketContext";

import Navbar from "./navbar";
import { AuthProvider } from "./context/AuthContext";

// Space Grotesk needs weight 800 for the bold hero/section titles
// used across the SBB redesign. Without it the headings silently
// fall back to a synthetic-bold of the 700 weight (or worse, the
// browser default sans-serif), which looks wrong.
const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "GuesSBB",
  description: "Wo zum Teufel ist der Zug gerade? Das Schweizer Bahn-Ratespiel.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className={`${spaceGrotesk.variable} ${ibmPlexMono.variable}`}>
      <head>
        {/* Hard fallback: pull Space Grotesk + IBM Plex Mono directly from
            Google Fonts. Belt-and-suspenders with next/font so the design
            survives Tailwind preflight resets and prod build oddities.
            Includes weight 800 for hero/section headlines. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600;700&display=swap"
        />
      </head>
      {/* Apply Next.js font className AND variable: className forces the
          actual font-family on body (winning vs Tailwind preflight),
          variables let other elements opt into the mono via CSS var. */}
      <body className={`${spaceGrotesk.className}`}>
        <WebSocketProvider>
          <AuthProvider>
            <Navbar />
            <main>{children}</main>
          </AuthProvider>
        </WebSocketProvider>
      </body>
    </html>
  );
}
