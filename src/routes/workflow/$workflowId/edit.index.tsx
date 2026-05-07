import { createFileRoute } from "@tanstack/react-router";

import { VisaWorkflowEditorPage } from "@/components/visa-workflow/page";

export const Route = createFileRoute("/workflow/$workflowId/edit/")({
  component: RouteComponent,
});

function RouteComponent() {
  return <VisaWorkflowEditorPage />;
}
