import type { Metadata } from "next";
import { Space_Grotesk, IBM_Plex_Mono } from "next/font/google";
import "@/styles/globals.css";
import { WebSocketProvider } from "@/context/WebSocketContext";
import { App as AntdApp } from "antd";

import Navbar from "./navbar";
import { AuthProvider } from "./context/AuthContext";
import NotificationListener from "@/websockets/NotificationListener";
import { NotificationProvider } from "@/context/NotificationContext";


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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600;700&display=swap"
        />
      </head>
      <body className={`${spaceGrotesk.className}`}>
        <WebSocketProvider>
          <NotificationProvider>
              <AuthProvider>
                  <AntdApp>
                    <NotificationListener />
                    <Navbar />
                    <main>{children}</main>
                  </AntdApp>
              </AuthProvider>
        </NotificationProvider>
      </WebSocketProvider>
      </body>
    </html>
  );
}
