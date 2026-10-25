import type { Metadata } from "next";
import { PageTransition } from "@/components/page-transition";
import { FinancasPage } from "@/components/pages/financas-page";

export const metadata: Metadata = {
  title: "Finanças",
};

export default function Page() {
  return (
    <PageTransition>
      <FinancasPage />
    </PageTransition>
  );
}
