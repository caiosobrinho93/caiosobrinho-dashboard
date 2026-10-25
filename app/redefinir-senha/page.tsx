import type { Metadata } from "next";
import { PageTransition } from "@/components/page-transition";
import { AuthPage } from "@/components/pages/auth-page";

export const metadata: Metadata = {
  title: "Redefinir senha",
  description: "Defina uma nova senha para sua conta do dashboard pessoal.",
};

export default function Page() {
  return (
    <PageTransition>
      <AuthPage mode="reset" />
    </PageTransition>
  );
}
