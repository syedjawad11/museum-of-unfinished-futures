import type { Metadata } from "next";
import { display, mono } from "@/fonts/fonts";
import { Hall } from "@/components/Hall";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { SITE_TITLE } from "@/content/og-card";
import "./globals.css";

const SITE_DESCRIPTION =
  "An interactive museum of fictional inventions from futures that never happened.";

export const metadata: Metadata = {
  metadataBase: new URL("https://museum-of-unfinished-futures.netlify.app"),
  title: {
    template: `%s — ${SITE_TITLE}`,
    default: SITE_TITLE,
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
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
