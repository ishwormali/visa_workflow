import { createFileRoute } from "@tanstack/react-router";

import { VisaWorkflowHomePage } from "@/components/visa-workflow/page";
import { VisaWorkflowProvider } from "@/components/visa-workflow/provider";

export const Route = createFileRoute("/")({ component: App });

function App() {
  return (
    <VisaWorkflowProvider>
      <VisaWorkflowHomePage />
    </VisaWorkflowProvider>
  );
}
