import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type AppHeaderProps = {
  logo: ReactNode;
  title: ReactNode;
  content?: ReactNode;
  menus?: ReactNode;
  className?: string;
  contentClassName?: string;
  menusClassName?: string;
};

export function AppHeader({
  logo,
  title,
  content,
  menus,
  className,
  contentClassName,
  menusClassName,
}: AppHeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b border-(--rule) bg-[color-mix(in_oklab,var(--paper)_88%,transparent)] backdrop-blur-[10px] backdrop-saturate-150",
        className,
      )}
    >
      <div className="mx-auto flex max-w-[680px] items-center gap-4 px-6 py-3.5">
        <div className="flex items-center gap-2.5">
          {logo}
          {title}
        </div>

        <div className="flex-1" />

        {content ? <div className={contentClassName}>{content}</div> : null}
        {menus ? (
          <div className={cn("flex items-center gap-1.5", menusClassName)}>{menus}</div>
        ) : null}
      </div>
    </header>
  );
}
