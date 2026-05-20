import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import faviconUrl from "@/assets/favicon.svg?url";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Betpreneur — Daily football picks" },
      { name: "description", content: "Daily pre-match football picks with a documented 66.3% hit rate. Built for Nigerian punters." },
      { name: "author", content: "Project Betpreneur" },
      { property: "og:title", content: "Betpreneur — Daily football picks" },
      { property: "og:description", content: "Daily pre-match football picks with a documented 66.3% hit rate. Built for Nigerian punters." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@Lovable" },
      { name: "twitter:title", content: "Betpreneur — Daily football picks" },
      { name: "twitter:description", content: "Daily pre-match football picks with a documented 66.3% hit rate. Built for Nigerian punters." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/c1d819c8-b8ab-4a30-915b-d2b3b4139a7b/id-preview-879ff483--dd03e80d-9415-405e-983e-73f6a243c9d5.lovable.app-1777551394453.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/c1d819c8-b8ab-4a30-915b-d2b3b4139a7b/id-preview-879ff483--dd03e80d-9415-405e-983e-73f6a243c9d5.lovable.app-1777551394453.png" },
    ],
    links: [
      { rel: "icon", type: "image/png", href: faviconUrl },
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <AuthProvider>
      <AppShell>
        <Outlet />
      </AppShell>
    </AuthProvider>
  );
}
