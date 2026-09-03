import type {
  Metadata,
} from "next";

import {
  Suspense,
} from "react";

import {
  Geist,
  Geist_Mono,
} from "next/font/google";

import {
  NextIntlClientProvider,
} from "next-intl";

import {
  getLocale,
} from "next-intl/server";

import BottomNavigation from "@/components/bottom-navigation";

import "./globals.css";


const geistSans =
  Geist({
    variable:
      "--font-geist-sans",

    subsets: [
      "latin",
    ],
  });


const geistMono =
  Geist_Mono({
    variable:
      "--font-geist-mono",

    subsets: [
      "latin",
    ],
  });


export const metadata:
  Metadata = {
  title:
    "Couple Wallet",

  description:
    "Personal and shared money management.",
};


export default async function RootLayout({
  children,
}: Readonly<{
  children:
    React.ReactNode;
}>) {
  const locale =
    await getLocale();


  return (
    <html
      lang={
        locale
      }
    >

      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >

        <NextIntlClientProvider>

          {/* Extra bottom spacing prevents
              content from hiding behind nav */}
          <div className="pb-24">
            {children}
          </div>


          <Suspense
            fallback={
              null
            }
          >
            <BottomNavigation />
          </Suspense>

        </NextIntlClientProvider>

      </body>

    </html>
  );
}