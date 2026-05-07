import { Outlet, createFileRoute } from "@tanstack/react-router";

import { VisaWorkflowRouteProvider } from "@/components/visa-workflow/provider";

export const Route = createFileRoute("/workflow/$workflowId/edit")({
  component: RouteComponent,
});

function RouteComponent() {
  const { workflowId } = Route.useParams();

  return (
    <VisaWorkflowRouteProvider sessionId={workflowId}>
      <Outlet />
    </VisaWorkflowRouteProvider>
  );
}
