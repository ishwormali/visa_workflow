import { Home } from "lucide-react";
import { useState } from "react";

import { AppHeader } from "../visa-design/app-header";
import { visaButtonVariants } from "../visa-design/primitives";
import { SettingsDialog } from "./settings-dialog";

export const WorkflowHeader = () => {
  const [openSettings, setOpenSettings] = useState(false);
  return (
    <AppHeader>
      <AppHeader.Brand>
        <AppHeader.Logo>V</AppHeader.Logo>
        <AppHeader.Title accent="workflow">visa </AppHeader.Title>
      </AppHeader.Brand>

      <AppHeader.Trailing>
        {/* <AppHeader.Meta label="SUBMISSIONS" value={PAST_SESSIONS.length} /> */}
        <AppHeader.Actions>
          <a
            href="/"
            rel="noopener noreferrer"
            className={visaButtonVariants({ variant: "ghost", size: "sm" })}
          >
            <Home size={14} />
            Home
          </a>
          {/* <VisaButton
            // active={showHistory}
            size="sm"
            variant="ghost"
            // onClick={() => setShowHistory(true)}
          >
            <Home size={14} />
            Home
          </VisaButton> */}

          <SettingsDialog open={openSettings} onOpenChange={setOpenSettings}></SettingsDialog>
        </AppHeader.Actions>
      </AppHeader.Trailing>
    </AppHeader>
  );
};
