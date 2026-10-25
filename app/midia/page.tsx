import type { Metadata } from "next";
import { PageTransition } from "@/components/page-transition";
import { MidiaPage } from "@/components/pages/midia-page";

export const metadata: Metadata = {
  title: "Mídia",
};

export default function Page() {
  return (
    <PageTransition>
      <MidiaPage />
    </PageTransition>
  );
}
