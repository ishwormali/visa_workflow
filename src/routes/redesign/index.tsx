import { createFileRoute } from "@tanstack/react-router"

import { VisaWorkflowProvider } from "@/components/visa-workflow/provider"
import { VisaDesignApp } from "@/components/visa-design/app"

export const Route = createFileRoute("/redesign/")({ component: App })

function App() {
  return (
    <VisaWorkflowProvider>
      <VisaDesignApp />
    </VisaWorkflowProvider>
  )
}
