import { VisaWorkflowEditorPage } from "@/components/visa-workflow/page"
import { VisaWorkflowRouteProvider } from "@/components/visa-workflow/provider"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/workflow/$workflowId/edit")({ component: RouteComponent })

function RouteComponent() {
  const { workflowId } = Route.useParams()

  return (
    <VisaWorkflowRouteProvider sessionId={workflowId}>
      <VisaWorkflowEditorPage />
    </VisaWorkflowRouteProvider>
  )
}