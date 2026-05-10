import { useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { EMAIL_CONFIG, LAST_DATES, type DocDates, type EmailConfig } from "../visa-design/data";
import { WorkflowStepRail, type WorkflowStepIndex } from "./components/workflow-step-rail";
import { DoneStep } from "./steps/done-step";
import { EmailStep } from "./steps/email-step";
import { GenerateStep } from "./steps/generate-step";
import { PhotosStep } from "./steps/photos-step";
import { ScanStep } from "./steps/scan-step";
import { SetupStep } from "./steps/setup-step";

const MAX_STEP: WorkflowStepIndex = 5;

function isWorkflowStepIndex(value: number): value is WorkflowStepIndex {
  return Number.isInteger(value) && value >= 0 && value <= MAX_STEP;
}

function readStepFromPathname(pathname: string): WorkflowStepIndex | null {
  const match = pathname.match(/\/step\/(\d+)\/?$/);

  if (!match) {
    return null;
  }

  const parsed = Number(match[1]);

  return isWorkflowStepIndex(parsed) ? parsed : null;
}

function createStepPath(pathname: string, step: WorkflowStepIndex) {
  if (pathname.startsWith("/workflow/new")) {
    return `/workflow/new/step/${step}`;
  }

  const editMatch = pathname.match(/^\/workflow\/([^/]+)\/edit(?:\/step\/\d+)?\/?$/);

  if (!editMatch) {
    return null;
  }

  return `/workflow/${editMatch[1]}/edit/step/${step}`;
}

export function VisaWorkflowEditorPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const routeStep = readStepFromPathname(location.pathname);

  const [currentStep, setCurrentStep] = useState<WorkflowStepIndex>(routeStep ?? 0);
  const [docDates, setDocDates] = useState<DocDates>(LAST_DATES);
  const [emailConfig] = useState<EmailConfig>(EMAIL_CONFIG);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (routeStep === null || routeStep === currentStep) {
      return;
    }

    setCurrentStep(routeStep);
  }, [currentStep, routeStep]);

  useEffect(() => {
    if (routeStep !== null && routeStep === currentStep) {
      return;
    }

    const nextPath = createStepPath(location.pathname, currentStep);

    if (nextPath && nextPath !== location.pathname) {
      void navigate({ to: nextPath, replace: true });
    }
  }, [currentStep, location.pathname, navigate, routeStep]);

  const goto = (n: WorkflowStepIndex) => {
    if (n !== 5) setSent(false);
    setCurrentStep(n);
  };

  const reset = () => {
    setSent(false);
    setCurrentStep(0);
  };

  let body: React.ReactNode = null;
  if (currentStep === 0) {
    body = (
      <SetupStep
        docDates={docDates}
        setDocDates={setDocDates}
        emailConfig={emailConfig}
        onNext={() => goto(1)}
        onEditEmail={() => {
          /* settings dialog handled by WorkflowHeader */
        }}
      />
    );
  } else if (currentStep === 1) {
    body = <ScanStep docDates={docDates} onBack={() => goto(0)} onNext={() => goto(2)} />;
  } else if (currentStep === 2) {
    body = <PhotosStep onBack={() => goto(1)} onNext={() => goto(3)} />;
  } else if (currentStep === 3) {
    body = <GenerateStep docDates={docDates} onBack={() => goto(2)} onNext={() => goto(4)} />;
  } else if (currentStep === 4) {
    body = (
      <EmailStep
        docDates={docDates}
        emailConfig={emailConfig}
        onBack={() => goto(3)}
        onNext={() => goto(5)}
      />
    );
  } else {
    body = <DoneStep sent={sent} onSent={() => setSent(true)} onReset={reset} />;
  }

  return (
    <main
      className="relative z-10 mx-auto max-w-[680px] px-6 pt-9 pb-[100px]"
      data-screen-label={`step-${currentStep}`}
    >
      {currentStep > 0 && <WorkflowStepRail current={currentStep} onNav={goto} />}
      {body}
    </main>
  );
}
