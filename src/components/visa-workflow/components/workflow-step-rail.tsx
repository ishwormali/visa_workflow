import { StepRail, type StepRailItem } from "../../visa-design/ui-bits";

export type WorkflowStepIndex = 0 | 1 | 2 | 3 | 4 | 5;

const WORKFLOW_STEP_ITEMS: StepRailItem[] = [
  { n: 0, label: "Setup" },
  { n: 1, label: "Docs" },
  { n: 2, label: "Photos" },
  { n: 3, label: "Gen" },
  { n: 4, label: "Email" },
  { n: 5, label: "Done" },
];

const WORKFLOW_STEP_ITEMS_WITHOUT_PHOTOS: StepRailItem[] = [
  { n: 0, label: "Setup" },
  { n: 1, label: "Docs" },
  { n: 3, label: "Gen" },
  { n: 4, label: "Email" },
  { n: 5, label: "Done" },
];

export function WorkflowStepRail({
  current,
  onNav,
  includePhotos = true,
}: {
  current: WorkflowStepIndex;
  onNav?: (n: WorkflowStepIndex) => void;
  includePhotos?: boolean;
}) {
  return (
    <StepRail
      current={current}
      items={includePhotos ? WORKFLOW_STEP_ITEMS : WORKFLOW_STEP_ITEMS_WITHOUT_PHOTOS}
      onNav={onNav ? (n) => onNav(n as WorkflowStepIndex) : undefined}
    />
  );
}
