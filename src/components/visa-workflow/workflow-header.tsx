import { AppHeader } from "../visa-design/app-header";
import { VisaButton } from "../visa-design/primitives";

export const WorkflowHeader = () => {
  return (
    <AppHeader>
      <AppHeader.Brand>
        <AppHeader.Logo>V</AppHeader.Logo>
        <AppHeader.Title accent="workflow">visa </AppHeader.Title>
      </AppHeader.Brand>

      <AppHeader.Trailing>
        {/* <AppHeader.Meta label="SUBMISSIONS" value={PAST_SESSIONS.length} /> */}
        <AppHeader.Actions>
          <VisaButton
            // active={showHistory}
            size="md"
            variant="ghost"
            // onClick={() => setShowHistory(true)}
          >
            ⏱ History
          </VisaButton>
          <VisaButton
            size="md"
            variant="ghost"
            //   onClick={() => setShowSettings(true)}
          >
            ⚙ Settings
          </VisaButton>
        </AppHeader.Actions>
      </AppHeader.Trailing>
    </AppHeader>
  );
};
