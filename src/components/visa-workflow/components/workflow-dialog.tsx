import { Dialog as DialogPrimitive } from "@base-ui/react";
import type { ComponentPropsWithoutRef } from "react";

import { DialogClose, DialogOverlay, DialogPortal } from "@/components/ui/dialog";
import { VisaButton } from "@/components/visa-design/primitives";
import { cn } from "@/lib/utils";

export function WorkflowDialogOverlay({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof DialogPrimitive.Backdrop>) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="dialog-overlay"
      className={cn(
        // "fixed inset-0 z-100 overflow-y-auto bg-[color-mix(in_oklab,var(--paper)_70%,transparent)] px-6 py-10 backdrop-blur-[6px]",
        "fixed inset-0 isolate z-50 bg-[color-mix(in_oklab,var(--paper)_70%,transparent)] duration-100 supports-backdrop-filter:backdrop-blur-sm data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",

        className,
      )}
      {...props}
    />
  );
}

export function WorkflowDialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: DialogPrimitive.Popup.Props & {
  showCloseButton?: boolean;
}) {
  return (
    <DialogPortal>
      {/* <WorkflowDialogOverlay /> */}
      <DialogOverlay className={cn("bg-[color-mix(in_oklab,var(--paper)_70%,transparent)]")} />
      <DialogPrimitive.Popup
        data-slot="dialog-content"
        className={cn(
          // "fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-6 rounded-4xl bg-popover p-6 text-sm text-popover-foreground shadow-xl ring-1 ring-foreground/5 duration-100 outline-none sm:max-w-md dark:ring-foreground/10 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
          "fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-6 mx-auto overflow-hidden rounded-[12px] border border-(--rule) bg-(--paper-2) shadow-[0_20px_60px_rgba(60,40,20,0.12)]",
          className,
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogClose
            className={"top-4 right-4"}
            render={
              <VisaButton size="sm" variant="ghost" className="absolute top-2 right-2">
                Close ✕
              </VisaButton>
            }
          ></DialogClose>
        )}
      </DialogPrimitive.Popup>
    </DialogPortal>
  );
}
