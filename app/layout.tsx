import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { SwRegister } from "./sw-register";

const fontSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "RUMI",
  description: "Asisten digital untuk urusan rumah sehari-hari.",
};

export const viewport: Viewport = {
  themeColor: "#D97757",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className={`${fontSans.variable} bg-[#F5EEE4] text-[#382F2A] font-sans`}>
        {children}
        <SwRegister />
      </body>
    </html>
  );
}
