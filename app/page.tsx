import type { Metadata } from "next";
import { PageTransition } from "@/components/page-transition";
import { HomePage } from "@/components/pages/home-page";

export const metadata: Metadata = {
  title: { absolute: "Início · Dashboard pessoal" },
};

export default function Page() {
  return (
    <PageTransition>
      <HomePage />
    </PageTransition>
  );
}
