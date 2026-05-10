import { StepRail, type StepRailItem } from "../../visa-design/ui-bits";

export type WorkflowStepIndex = 0 | 1 | 2 | 3 | 4 | 5;

export const WORKFLOW_STEP_ITEMS: StepRailItem[] = [
  { n: 0, label: "Setup" },
  { n: 1, label: "Scan" },
  { n: 2, label: "Photos" },
  { n: 3, label: "Gen" },
  { n: 4, label: "Email" },
  { n: 5, label: "Done" },
];

export function WorkflowStepRail({
  current,
  onNav,
}: {
  current: WorkflowStepIndex;
  onNav?: (n: WorkflowStepIndex) => void;
}) {
  return (
    <StepRail
      current={current}
      items={WORKFLOW_STEP_ITEMS}
      onNav={onNav ? (n) => onNav(n as WorkflowStepIndex) : undefined}
    />
  );
}
