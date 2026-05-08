import { Settings } from "lucide-react";

import { Dialog, DialogFooter, DialogTrigger } from "../ui/dialog";
import {
  VisaButton,
  VisaDivider,
  VisaField,
  VisaFieldGrid,
  VisaFieldLabel,
  VisaInput,
  VisaModalHeader,
  VisaModalTitle,
} from "../visa-design/primitives";
import { WorkflowDialogContent } from "./components/workflow-dialog";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children?: React.ReactNode;
}
export const SettingsDialog = ({ open, onOpenChange }: SettingsDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger>
        <VisaButton variant="ghost" size={"sm"}>
          <Settings size={14} />
          Settings
        </VisaButton>
      </DialogTrigger>

      <WorkflowDialogContent className={"max-w-130"} showCloseButton={true}>
        <VisaModalHeader>
          <VisaModalTitle>Settings</VisaModalTitle>
        </VisaModalHeader>

        <div className="px-6">
          <VisaField className="mb-3">
            <VisaFieldLabel>To</VisaFieldLabel>
            <VisaInput
            //   value={}
            //   onChange={(e) => setDraft({ ...draft, to: e.target.value })}
            />
          </VisaField>
          <VisaField className="mb-3">
            <VisaFieldLabel>CC</VisaFieldLabel>
            <VisaInput
            //   value={draft.cc}
            //   onChange={(e) => setDraft({ ...draft, cc: e.target.value })}
            />
          </VisaField>
          <VisaFieldGrid className="mb-3">
            <VisaField>
              <VisaFieldLabel>Greeting</VisaFieldLabel>
              <VisaInput
              // value={draft.greeting}
              // onChange={(e) => setDraft({ ...draft, greeting: e.target.value })}
              />
            </VisaField>
            <VisaField>
              <VisaFieldLabel>Sign-off</VisaFieldLabel>
              <VisaInput
              // value={draft.signoff}
              // onChange={(e) => setDraft({ ...draft, signoff: e.target.value })}
              />
            </VisaField>
          </VisaFieldGrid>
          <VisaDivider />
          <div className="flex items-center justify-between border-b border-(--rule) py-3">
            <div>
              <div className="text-[13px] text-(--ink)">Re-seed doc types</div>
              <div className="mt-0.5 font-mono text-[11px] text-(--ink-3)">
                Re-reads the Document list Google Doc
              </div>
            </div>
            <VisaButton size="sm">⟳ Re-seed</VisaButton>
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <div className="text-[13px] text-(--ink)">Clear all sessions</div>
              <div className="mt-0.5 font-mono text-[11px] text-(--ink-3)">
                {/* {PAST_SESSIONS.length} sessions stored locally */}
              </div>
            </div>
            <VisaButton size="sm">Clear…</VisaButton>
          </div>
          <DialogFooter>
            <VisaButton size="sm" variant="ghost">
              Cancel
            </VisaButton>
            <VisaButton
              //   onClick={() => {
              //     setEmailConfig(draft);
              //     onClose();
              //   }}
              size="sm"
              variant="primary"
            >
              Save
            </VisaButton>
          </DialogFooter>
        </div>
      </WorkflowDialogContent>
    </Dialog>
  );
};
