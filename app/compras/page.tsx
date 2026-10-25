import type { Metadata } from "next";
import { PageTransition } from "@/components/page-transition";
import { ComprasPage } from "@/components/pages/compras-page";

export const metadata: Metadata = {
  title: "Compras",
};

export default function Page() {
  return (
    <PageTransition>
      <ComprasPage />
    </PageTransition>
  );
}
