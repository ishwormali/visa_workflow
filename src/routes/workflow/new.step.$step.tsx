import { VisaWorkflowEditorPage } from "@/components/visa-workflow/page"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/workflow/new/step/$step")({
  component: RouteComponent,
})

function RouteComponent() {
  return <VisaWorkflowEditorPage />
}
