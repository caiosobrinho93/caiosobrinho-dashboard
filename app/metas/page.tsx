import type { Metadata } from "next";
import { PageTransition } from "@/components/page-transition";
import { MetasPage } from "@/components/pages/metas-page";

export const metadata: Metadata = {
  title: "Metas",
};

export default function Page() {
  return (
    <PageTransition>
      <MetasPage />
    </PageTransition>
  );
}
