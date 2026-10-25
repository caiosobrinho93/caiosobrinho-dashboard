import type { Metadata } from "next";
import { PageTransition } from "@/components/page-transition";
import { MaisPage } from "@/components/pages/mais-page";

export const metadata: Metadata = {
  title: "Mais",
};

export default function Page() {
  return (
    <PageTransition>
      <MaisPage />
    </PageTransition>
  );
}
