import { usePwaInstall } from "@/hooks/usePwaInstall";
import { Button } from "@/components/ui/button";

export function PwaInstallPrompt() {
  const { isInstallable, promptInstall, dismissPrompt } = usePwaInstall();

  if (!isInstallable) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md">
      <div className="bg-background border border-border rounded-lg p-4 shadow-lg">
        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary">
              <svg
                className="h-6 w-6 text-primary-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">Install App</h3>
              <p className="text-sm text-muted-foreground">
                Add BetPreneur to your home screen for quick access and a better experience.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={dismissPrompt}
              className="flex-1"
            >
              Not now
            </Button>
            <Button
              size="sm"
              onClick={promptInstall}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              Install
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}