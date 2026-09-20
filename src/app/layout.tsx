import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Museum of Unfinished Futures",
  description:
    "An interactive museum of fictional inventions from futures that never happened.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
