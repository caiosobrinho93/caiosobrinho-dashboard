import type { Metadata } from "next";
import { PageTransition } from "@/components/page-transition";
import { NotasPage } from "@/components/pages/notas-page";

export const metadata: Metadata = {
  title: "Notas",
};

export default function Page() {
  return (
    <PageTransition>
      <NotasPage />
    </PageTransition>
  );
}
