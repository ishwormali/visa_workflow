import { cn } from "@/lib/utils";

export const WorkflowSection: React.FC<{ children?: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => {
  return (
    <div
      className={cn(
        `overflow-hidden rounded-vd border border-rule bg-paper-2 font-visa-display shadow-vd-sm`,
        className,
      )}
    >
      {children}
    </div>
  );
};

export const WorkflowAside: React.FC<{ children?: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => {
  return (
    <aside
      className={cn(
        `rounded-vdfont-visa-display overflow-hidden rounded-vd-lg border border-rule bg-paper-2 shadow-vd-sm`,
        className,
      )}
    >
      {children}
    </aside>
  );
};

export const WorkflowSectionHeader: React.FC<{
  children?: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  return (
    <div
      className={cn(
        `flex items-center justify-between gap-3 border-b border-rule px-4 py-3`,
        className,
      )}
    >
      {children}
    </div>
  );
};

export const WorkflowSectionContent: React.FC<{
  children?: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  return <div className={cn(`p-4`, className)}>{children}</div>;
};

export const WorkflowGridRow: React.FC<{ children?: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => {
  return (
    <div
      className={cn(
        "grid grid-cols-[28px_minmax(0,1fr)_auto] items-start gap-3 border-b border-rule px-4 py-3.5 last:border-b-0",
        className,
      )}
    >
      {children}
    </div>
  );
};
