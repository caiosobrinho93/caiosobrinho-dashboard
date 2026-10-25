import { Capacitor } from "@capacitor/core";
import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";
import { SplashScreen } from "@capacitor/splash-screen";
import { StatusBar, Style } from "@capacitor/status-bar";

export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform();
}

export async function prepareNativeShell(): Promise<void> {
  if (!isNativeApp()) return;

  document.documentElement.dataset.platform = "native";

  try {
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: "#181818" });
  } catch {
    // Android 15+ controls the status bar appearance through system bars / the theme.
  }
}

export async function hideNativeSplash(): Promise<void> {
  if (!isNativeApp()) return;

  try {
    await SplashScreen.hide({ fadeOutDuration: 220 });
  } catch {
    // Splash screen is optional; a failure here must never block the app.
  }
}

export async function hapticTap(): Promise<void> {
  if (!isNativeApp()) return;

  try {
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch {
    // Haptics are a progressive enhancement.
  }
}

export async function hapticSuccess(): Promise<void> {
  if (!isNativeApp()) return;

  try {
    await Haptics.notification({ type: NotificationType.Success });
  } catch {
    // Haptics are a progressive enhancement.
  }
}
