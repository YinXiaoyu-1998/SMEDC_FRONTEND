import { QueryClientProvider } from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { ApiFeedbackBridge } from "@/app/ApiFeedbackBridge";
import { AuthFeedbackProvider } from "@/app/AuthFeedbackProvider";
import { TextProvider } from "@/i18n/TextProvider";

interface AppProvidersProps {
  readonly queryClient: QueryClient;
  readonly children: ReactNode;
}

export function AppProviders({ queryClient, children }: AppProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <TextProvider>
        <AuthFeedbackProvider>
          <ApiFeedbackBridge />
          {children}
        </AuthFeedbackProvider>
      </TextProvider>
    </QueryClientProvider>
  );
}
