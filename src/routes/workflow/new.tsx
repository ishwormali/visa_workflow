import { VisaWorkflowEditorPage } from "@/components/visa-workflow/page"
import { VisaWorkflowRouteProvider } from "@/components/visa-workflow/provider"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/workflow/new")({ component: RouteComponent })

function RouteComponent() {
  return (
    <VisaWorkflowRouteProvider>
      <VisaWorkflowEditorPage />
    </VisaWorkflowRouteProvider>
  )
}