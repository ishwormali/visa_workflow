import { VisaWorkflowRouteProvider } from "@/components/visa-workflow/provider"
import { Outlet, createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/workflow/new")({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <VisaWorkflowRouteProvider>
      <Outlet />
    </VisaWorkflowRouteProvider>
  )
}
