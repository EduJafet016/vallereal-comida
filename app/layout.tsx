import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { Analytics } from "@vercel/analytics/react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Extraemos las propiedades visuales del dispositivo a la API Viewport
export const viewport: Viewport = {
  themeColor: "#047857",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Evita que la pantalla haga un zoom molesto al tocar un input en iOS
};

// Centralizamos los metadatos y configuración PWA en la API Metadata
export const metadata: Metadata = {
  title: "Valle Real - Comida Local",
  description: "Pide tus platillos favoritos en Valle Real sin comisiones.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Valle Real",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white text-gray-900`}>
        <CartProvider>
          <div className="max-w-md mx-auto min-h-screen bg-white relative flex flex-col justify-between pb-6">
            <div>{children}</div>
          </div>
        </CartProvider>
        <Analytics />
      </body>
    </html>
  );
}