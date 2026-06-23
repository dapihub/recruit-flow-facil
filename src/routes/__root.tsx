import { createRootRoute, Outlet, ScrollRestoration } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/lib/auth";
import { ThemeProvider } from "@/hooks/useTheme";
import { HideValuesProvider } from "@/hooks/useHideValues";
import { Toaster } from "sonner";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 5, retry: 1 },
  },
});

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <HideValuesProvider>
          <AuthProvider>
            <ScrollRestoration />
            <Outlet />
            <Toaster richColors position="top-right" />
          </AuthProvider>
        </HideValuesProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
