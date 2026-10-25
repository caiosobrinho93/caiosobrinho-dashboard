import type { Metadata } from "next";
import { PageTransition } from "@/components/page-transition";
import { AuthPage } from "@/components/pages/auth-page";

export const metadata: Metadata = {
  title: "Recuperar senha",
  description: "Solicite um link seguro para redefinir a senha da sua conta.",
};

export default function Page() {
  return (
    <PageTransition>
      <AuthPage mode="recover" />
    </PageTransition>
  );
}
