import type { Metadata } from "next";
import { display, mono } from "@/fonts/fonts";
import { Hall } from "@/components/Hall";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://museum-of-unfinished-futures.netlify.app"),
  title: "Museum of Unfinished Futures",
  description:
    "An interactive museum of fictional inventions from futures that never happened.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-hall text-ink">
        <Hall>
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </Hall>
      </body>
    </html>
  );
}
