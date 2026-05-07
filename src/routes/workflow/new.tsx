import { Outlet, createFileRoute } from "@tanstack/react-router";

import { VisaWorkflowRouteProvider } from "@/components/visa-workflow/provider";

export const Route = createFileRoute("/workflow/new")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <VisaWorkflowRouteProvider>
      <Outlet />
    </VisaWorkflowRouteProvider>
  );
}
