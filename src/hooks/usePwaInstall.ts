import { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    "beforeinstallprompt": BeforeInstallPromptEvent;
  }
}

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) return;
    
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  const dismissPrompt = () => {
    setDeferredPrompt(null);
    setIsInstallable(false);
    // Save dismissed state to localStorage
    localStorage.setItem("pwa-install-dismissed", Date.now().toString());
  };

  // Check if user previously dismissed (show again after 7 days)
  const wasRecentlyDismissed = () => {
    const dismissed = localStorage.getItem("pwa-install-dismissed");
    if (!dismissed) return false;
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    return Date.now() - parseInt(dismissed) < sevenDays;
  };

  return {
    deferredPrompt,
    isInstallable: isInstallable && !wasRecentlyDismissed(),
    isInstalled,
    promptInstall,
    dismissPrompt,
  };
}