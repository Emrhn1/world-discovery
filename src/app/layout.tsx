import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "World Discovery | Explore Ancient Wonders",
  description: "An immersive journey through the world's most remarkable places. Discover ancient wonders, hidden gems, and untold stories.",
  keywords: ["world discovery", "travel", "exploration", "historical sites", "ancient wonders", "interactive map"],
  authors: [{ name: "World Discovery Team" }],
  openGraph: {
    title: "World Discovery | Explore Ancient Wonders",
    description: "An immersive journey through the world's most remarkable places.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "World Discovery",
    description: "Discover the world's most remarkable places",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
  themeColor: "#0d0f13",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen bg-neutral-950 text-neutral-100 antialiased overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
