import { createFileRoute } from "@tanstack/react-router";

import { VisaDesignApp } from "@/components/visa-design/app";
import { VisaWorkflowProvider } from "@/components/visa-workflow/provider";

export const Route = createFileRoute("/redesign/")({ component: App });

function App() {
  return (
    <VisaWorkflowProvider>
      <VisaDesignApp />
    </VisaWorkflowProvider>
  );
}
