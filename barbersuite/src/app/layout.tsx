import type { Metadata } from "next";
import { Inter, Oswald } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const oswald = Oswald({
  subsets: ["latin"],
  variable: "--font-oswald",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "BarberSuite — Plataforma SaaS para Barbearias",
    template: "%s | BarberSuite",
  },
  description:
    "A plataforma completa para barbearias modernas. Agendamento online, gestão financeira, controle de estoque e muito mais.",
  keywords: [
    "barbearia",
    "software barbearia",
    "agendamento online",
    "gestão barbearia",
    "SaaS barbearia",
  ],
  openGraph: {
    type: "website",
    siteName: "BarberSuite",
    title: "BarberSuite — A Plataforma Completa para Barbearias",
    description:
      "Gerencie sua barbearia com profissionalismo. Agendamentos, relatórios, equipe e clientes em um só lugar.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${oswald.variable}`}>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="BarberSuite" />
        <link rel="apple-touch-icon" href="/logo.png" />
      </head>
      <body className="antialiased font-sans" style={{ background: '#030303', color: '#c8cfe0' }}>
        {children}
      </body>
    </html>
  );
}
