import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegistration } from "./components/ServiceWorkerRegistration";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mirokaï Experience",
  description:
    "PWA officielle de la Mirokaï Experience : un parcours de quiz immersif pour découvrir les robots Mirokaï et le Mirium, pensé pour les visiteurs de l’espace démo Enchanted Tools.",
  manifest: "/manifest.json",
  metadataBase: new URL("https://enchanted-tools.vercel.app"),
  openGraph: {
    title: "Mirokaï Experience",
    description:
      "Parcours narratif et ludique autour des robots Mirokaï, avec quiz scénarisés, transitions animées et outils d’administration pour l’équipe Enchanted Tools.",
    type: "website",
    siteName: "Mirokaï Experience",
    locale: "fr_FR",
    images: [
      {
        url: "/cover.jpg",
        width: 1024,
        height: 671,
        alt: "Portail lumineux dans un paysage extra-terrestre illustrant l’univers Mirokaï.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mirokaï Experience",
    description: "PWA immersive pour accompagner la découverte des robots Mirokaï au sein de la Mirokaï Experience.",
    images: ["/cover.jpg"],
  },
  icons: {
    icon: "/favicon/favicon.svg",
    shortcut: "/favicon/favicon.svg",
    apple: "/icons/icon-192x192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Mirokaï Experience",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#462B7E",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <head>
        <link rel="stylesheet" href="https://use.typekit.net/ofr7rcw.css" />
        <link rel="icon" type="image/svg+xml" href="/favicon/favicon.svg" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="manifest" href="/favicon/site.webmanifest" />
      </head>
      <body className={`${spaceGrotesk.variable} antialiased bg-[#462B7E]`}>
        {children}
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
