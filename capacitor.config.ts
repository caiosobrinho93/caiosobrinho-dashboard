import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.caiosobrinho.dashboardpessoal",
  appName: "Dashboard Pessoal",
  webDir: "out",
  backgroundColor: "#181818",
  android: {
    backgroundColor: "#181818",
    allowMixedContent: false,
  },
  plugins: {
    SystemBars: {
      insetsHandling: "css",
      initialViewportFitValueHint: "cover",
      style: "DARK",
      hidden: false,
    },
    SplashScreen: {
      launchAutoHide: false,
      launchShowDuration: 900,
      launchFadeOutDuration: 220,
      backgroundColor: "#181818",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: false,
    },
    Keyboard: {
      resizeOnFullScreen: true,
    },
  },
};

export default config;
