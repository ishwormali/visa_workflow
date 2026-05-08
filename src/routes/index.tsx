import { createFileRoute } from "@tanstack/react-router";

import { VisaDesignApp } from "@/components/visa-design/app";
import { VisaWorkflowHomePage } from "@/components/visa-workflow/page";
import { VisaWorkflowProvider } from "@/components/visa-workflow/provider";

export const Route = createFileRoute("/")({ component: App });

function App() {
  return (
    <VisaWorkflowProvider>
      <VisaWorkflowHomePage />
      {/* <VisaDesignApp /> */}
    </VisaWorkflowProvider>
  );
}
