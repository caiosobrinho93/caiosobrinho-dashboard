import type { Metadata } from "next";
import { PageTransition } from "@/components/page-transition";
import { AuthPage } from "@/components/pages/auth-page";

export const metadata: Metadata = {
  title: "Criar conta",
  description: "Crie uma conta para sincronizar o dashboard pessoal entre dispositivos.",
};

export default function Page() {
  return (
    <PageTransition>
      <AuthPage mode="signup" />
    </PageTransition>
  );
}
