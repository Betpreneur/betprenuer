import { useState, useEffect, useCallback } from "react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      console.log("PWA: beforeinstallprompt fired");
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) {
      console.log("PWA: no deferred prompt");
      return;
    }
    
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log("PWA: user choice", outcome);
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  return { promptInstall, deferredPrompt };
}