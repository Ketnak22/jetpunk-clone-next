import type { Metadata } from "next";
import { Geist, Geist_Mono, Nabla } from "next/font/google";
import "./globals.css";
import styles from './page.module.css'
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

import NavBar from "./NavBar";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Jetpunk Clone"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <NavBar />
        <main>  
          {children}
        </main>
      </body>
    </html>
  );
}
