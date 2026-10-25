import type { Metadata } from "next";
import { PageTransition } from "@/components/page-transition";
import { TarefasPage } from "@/components/pages/tarefas-page";

export const metadata: Metadata = {
  title: "Tarefas",
};

export default function Page() {
  return (
    <PageTransition>
      <TarefasPage />
    </PageTransition>
  );
}
