import type { Metadata } from "next";
import { IBM_Plex_Sans } from "next/font/google";
import { CustomToaster } from "@/shared/components/CustomToaster";
import "./globals.css";
// import { gilroy } from "@/fonts";

const ibmPlexSans = IBM_Plex_Sans({
  weight: ["200", "300", "400", "500", "600", "700"],
  variable: "--font-ibm-plex-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Core Admin",
  description: "Admin panel",
};

export default async function LocaleLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${ibmPlexSans.className} antialiased`}>
        <CustomToaster />
        {children}
      </body>
    </html>
  );
}
