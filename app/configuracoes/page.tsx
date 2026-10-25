import type { Metadata } from "next";
import { PageTransition } from "@/components/page-transition";
import { ConfiguracoesPage } from "@/components/pages/configuracoes-page";

export const metadata: Metadata = {
  title: "Configurações",
};

export default function Page() {
  return (
    <PageTransition>
      <ConfiguracoesPage />
    </PageTransition>
  );
}
