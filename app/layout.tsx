import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "테스트",
  description: "문의사항을 남기는 게시판입니다.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
