import localFont from "next/font/local";

// Fraunces — display serif used for museum titles and blueprint captions.
export const display = localFont({
  src: [
    {
      path: "../fonts/fraunces-latin-wght-normal.woff2",
      weight: "100 900",
      style: "normal",
    },
    {
      path: "../fonts/fraunces-latin-wght-italic.woff2",
      weight: "100 900",
      style: "italic",
    },
  ],
  variable: "--font-display",
  display: "swap",
});

// IBM Plex Mono — labels, accession tags and blueprint annotations.
export const mono = localFont({
  src: [
    {
      path: "../fonts/ibm-plex-mono-latin-400-normal.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../fonts/ibm-plex-mono-latin-500-normal.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../fonts/ibm-plex-mono-latin-400-italic.woff2",
      weight: "400",
      style: "italic",
    },
  ],
  variable: "--font-mono",
  display: "swap",
});
