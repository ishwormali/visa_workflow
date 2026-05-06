import { ChevronRight, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"

import { Field } from "./shared"

type PhotoCaptionDraft = {
  date: string
  people: string
  description: string
  formattedCaption: string
}

export function PhotoStep({
  currentCaption,
  currentPhotoFile,
  onFormatCaptionWithAi,
  onSaveCaptionAndContinue,
  onSkipCurrentPhoto,
  onSkipStep,
  onUpdateCurrentCaption,
  photoFiles,
  photoIndex,
}: {
  currentCaption: PhotoCaptionDraft | undefined
  currentPhotoFile: string | undefined
  onFormatCaptionWithAi: () => void
  onSaveCaptionAndContinue: () => void
  onSkipCurrentPhoto: () => void
  onSkipStep: () => void
  onUpdateCurrentCaption: (
    field: "date" | "people" | "description" | "formattedCaption" | "skipped",
    value: string | boolean
  ) => void
  photoFiles: string[]
  photoIndex: number
}) {
  return (
    <div className="mt-8 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-muted-foreground text-sm">
            {photoFiles.length
              ? `Photo ${photoIndex + 1} of ${photoFiles.length}`
              : "No photos detected."}
          </p>
          <h3 className="font-heading mt-1 text-2xl font-semibold">
            {currentPhotoFile ?? "Relationship photos"}
          </h3>
        </div>
        <Button variant="outline" onClick={onSkipStep}>
          Skip step
        </Button>
      </div>

      <div className="bg-secondary h-2 overflow-hidden rounded-full">
        <div
          className="bg-primary h-full rounded-full transition-[width]"
          style={{
            width: `${photoFiles.length ? ((photoIndex + 1) / photoFiles.length) * 100 : 0}%`,
          }}
        />
      </div>

      {currentCaption ? (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
          <div className="border-border/70 bg-card/80 rounded-[1.75rem] border p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Date">
                <input
                  type="date"
                  className="field"
                  value={currentCaption.date}
                  onChange={(event) =>
                    onUpdateCurrentCaption("date", event.target.value)
                  }
                />
              </Field>
              <Field label="People">
                <input
                  className="field"
                  value={currentCaption.people}
                  onChange={(event) =>
                    onUpdateCurrentCaption("people", event.target.value)
                  }
                  placeholder="Names in the photo"
                />
              </Field>
            </div>
            <Field label="Occasion / description" className="mt-4">
              <textarea
                className="field min-h-32 resize-y"
                value={currentCaption.description}
                onChange={(event) =>
                  onUpdateCurrentCaption("description", event.target.value)
                }
                placeholder="Where you were, why it matters, what happened"
              />
            </Field>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button variant="outline" onClick={onFormatCaptionWithAi}>
                <Sparkles />
                AI format
              </Button>
              <Button variant="outline" onClick={onSkipCurrentPhoto}>
                Skip photo
              </Button>
              <Button onClick={onSaveCaptionAndContinue}>
                Save caption
                <ChevronRight />
              </Button>
            </div>
          </div>

          <div className="border-border/70 bg-secondary/40 rounded-[1.75rem] border p-5">
            <p className="text-muted-foreground text-xs tracking-[0.24em] uppercase">
              Preview
            </p>
            <h4 className="font-heading mt-2 text-xl font-semibold">
              Formatted caption
            </h4>
            <p className="border-border/70 bg-background/80 text-foreground mt-4 rounded-[1.5rem] border p-4 text-sm leading-7">
              {currentCaption.formattedCaption ||
                "Use AI format to preview the caption text saved into the Google Doc."}
            </p>
          </div>
        </div>
      ) : (
        <div className="border-border/70 bg-card/80 text-muted-foreground rounded-[1.5rem] border p-5 text-sm">
          No detected photos require captions. Continue to generation.
        </div>
      )}
    </div>
  )
}
