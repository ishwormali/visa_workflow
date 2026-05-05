import { VisaWorkflowPage } from "@/components/visa-workflow/page"
import { VisaWorkflowProvider } from "@/components/visa-workflow/provider"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/")({ component: App })

function App() {
  return (
    <VisaWorkflowProvider>
      <VisaWorkflowPage />
    </VisaWorkflowProvider>
  )
}