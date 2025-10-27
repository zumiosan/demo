import type { Metadata } from "next";
import "./globals.css";
import { UserProvider } from "@/components/user-context";
import { Header } from "@/components/header";

export const metadata: Metadata = {
  title: "Cristal Match - AI プロジェクト管理",
  description: "AIエージェントによるプロジェクトマッチングと管理",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>
        <UserProvider>
          <Header />
          <main className="container mx-auto py-6">{children}</main>
        </UserProvider>
      </body>
    </html>
  );
}
