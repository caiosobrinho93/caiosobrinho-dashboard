import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { withBasePath } from "@/lib/base-path";

export const metadata: Metadata = {
  title: {
    default: "Dashboard pessoal",
    template: "%s · Dashboard pessoal",
  },
  description:
    "Tarefas, compras, finanças, metas, notas e links em um único painel pessoal com visual de editor de código.",
  applicationName: "Dashboard pessoal",
  manifest: withBasePath("/manifest.webmanifest"),
  icons: {
    icon: [
      { url: withBasePath("/icon.svg"), type: "image/svg+xml" },
      {
        url: withBasePath("/icon-192.png"),
        sizes: "192x192",
        type: "image/png",
      },
    ],
    apple: withBasePath("/apple-touch-icon.png"),
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Dashboard",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#1e1e1e",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" data-accent="azul">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
