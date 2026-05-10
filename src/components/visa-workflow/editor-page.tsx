import { useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect, useRef } from "react";

import { VisaButton, VisaButtonRow } from "../visa-design/primitives";
import { WorkflowStepRail, type WorkflowStepIndex } from "./components/workflow-step-rail";
import { LoadingScreen } from "./loading-screen";
import { useVisaWorkflow } from "./provider";
import { DoneStep } from "./steps/done-step";
import { EmailStep } from "./steps/email-step";
import { GenerateStep } from "./steps/generate-step";
import { PhotosStep } from "./steps/photos-step";
import { ScanStep } from "./steps/scan-step";
import { SetupStep } from "./steps/setup-step";
import { WorkflowHeader } from "./workflow-header";

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
  const { activeDocTypes, currentStep, goToStep, hydrated, saveWorkflow } = useVisaWorkflow();
  const hasPhotoStep = activeDocTypes.some((docType) => docType.requiresCaptions);
  const lastRouteStepRef = useRef<WorkflowStepIndex | null>(routeStep);

  useEffect(() => {
    if (routeStep === null || routeStep === currentStep) {
      return;
    }

    goToStep(routeStep);
  }, [currentStep, goToStep, routeStep]);

  useEffect(() => {
    const routeChanged = lastRouteStepRef.current !== routeStep;
    lastRouteStepRef.current = routeStep;

    if (routeChanged) {
      return;
    }

    if (routeStep !== null && routeStep === currentStep) {
      return;
    }

    const nextPath = createStepPath(location.pathname, currentStep);

    if (nextPath && nextPath !== location.pathname) {
      void navigate({ to: nextPath, replace: true });
    }
  }, [currentStep, location.pathname, navigate, routeStep]);

  const goto = (n: WorkflowStepIndex) => {
    if (n === 2 && !hasPhotoStep) {
      goToStep(3);
      return;
    }

    goToStep(n);
  };

  if (!hydrated) {
    return (
      <>
        <WorkflowHeader />
        <LoadingScreen />
      </>
    );
  }

  let body: React.ReactNode = null;
  if (currentStep === 0) {
    body = <SetupStep onNext={() => goto(1)} />;
  } else if (currentStep === 1) {
    body = <ScanStep onBack={() => goto(0)} onNext={() => goto(hasPhotoStep ? 2 : 3)} />;
  } else if (currentStep === 2) {
    body = <PhotosStep onBack={() => goto(1)} />;
  } else if (currentStep === 3) {
    body = <GenerateStep onBack={() => goto(hasPhotoStep ? 2 : 1)} />;
  } else if (currentStep === 4) {
    body = <EmailStep onBack={() => goto(3)} />;
  } else {
    body = <DoneStep />;
  }

  return (
    <>
      <WorkflowHeader />
      <main
        className="relative z-10 mx-auto max-w-170 px-6 pt-9 pb-25"
        data-screen-label={`step-${currentStep}`}
      >
        <VisaButtonRow align="right" className="mt-0 mb-4">
          <VisaButton size="sm" variant="ghost" onClick={saveWorkflow}>
            Save draft
          </VisaButton>
        </VisaButtonRow>
        <WorkflowStepRail current={currentStep} onNav={goto} includePhotos={hasPhotoStep} />
        {body}
      </main>
    </>
  );
}
