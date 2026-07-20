import { Geist, Geist_Mono } from "next/font/google";
import { CreativeToolLauncher } from "./components/creative-tool-launcher";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "AI Creative Script Generator",
  description: "Internal tool for video analysis and script generation",
  icons: {
    icon: [
      { url: "/icon.png?v=202605-final", type: "image/png" }
    ],
    shortcut: ["/icon.png?v=202605-final"],
    apple: [
      { url: "/apple-icon.png?v=202605-final", type: "image/png" }
    ],
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <CreativeToolLauncher />
      </body>
    </html>
  );
}
