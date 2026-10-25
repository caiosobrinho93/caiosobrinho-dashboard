"use client";
import { PageTransition } from "@/components/page-transition";
import { HomePage } from "@/components/pages/home-page";
import { AuthPage } from "@/components/pages/auth-page";
import { useAuth } from "@/components/auth-provider";

export default function Page() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <AuthPage mode="login" />;
  return (
    <PageTransition>
      <HomePage />
    </PageTransition>
  );
}

