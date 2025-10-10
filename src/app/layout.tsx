import type { Metadata } from "next";
import { Poppins, M_PLUS_Rounded_1c } from "next/font/google";
import { Providers } from "@/components/providers/providers";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const mPlusRounded = M_PLUS_Rounded_1c({
  variable: "--font-mplus-rounded",
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
});

export const metadata: Metadata = {
  title: "Instagram Post Generator",
  description: "ブログ記事からInstagram投稿素材を自動生成",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${poppins.variable} ${mPlusRounded.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
