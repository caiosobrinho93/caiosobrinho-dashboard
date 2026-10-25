"use client";
import { useEffect, useState } from "react";
import { PageTransition } from "@/components/page-transition";
import { HomePage } from "@/components/pages/home-page";
import { AuthPage } from "@/components/pages/auth-page";
import { useAuth } from "@/components/auth-provider";

export default function Page() {
  const { user, loading } = useAuth();
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [currentVersion, setCurrentVersion] = useState("1.0.0");
  const [downloadUrl, setDownloadUrl] = useState("");
  useEffect(() => {
    fetch("https://raw.githubusercontent.com/caiosobrinho93/caiosobrinho-dashboard/main/version.json")
      .then(res => res.json())
      .then(data => {
        if (data.version > currentVersion) {
          setUpdateAvailable(true);
          setDownloadUrl(data.downloadUrl);
        }
      })
      .catch(err => console.error(err));
  }, [currentVersion]);
  if (loading) return null;
  if (!user) return <AuthPage mode="login" />;
  return (
    <PageTransition>
      <HomePage />
    </PageTransition>
  );
}

