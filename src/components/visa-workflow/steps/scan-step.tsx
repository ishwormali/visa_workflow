import {
  FolderSearch,
  ChevronRight,
  LoaderCircle,
  Settings2,
} from "lucide-react"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  getGoogleDriveAccessToken,
  hasGoogleDriveAccessToken,
  listGoogleDriveFolders,
  type GoogleDriveFile,
} from "@/lib/google-drive"
import { cn } from "@/lib/utils"
import {
  type DocTypeConfig,
  type VisaConfig,
  type VisaSessionRecord,
  type WorkflowDocumentState,
} from "@/lib/visa-workflow"

import { Field, LogPanel, OverlayPanel, StatusBadge } from "./shared"

function SetupStep({
  activeDocTypes,
  config,
  documents,
  latestSession,
  onEditSettings,
  onHandleDateChange,
}: {
  activeDocTypes: DocTypeConfig[]
  config: VisaConfig
  documents: WorkflowDocumentState[]
  latestSession: VisaSessionRecord | undefined
  onEditSettings: () => void
  onHandleDateChange: (
    docTypeId: string,
    key: "date" | "from" | "to",
    value: string
  ) => void
}) {
  return (
    <div className="mt-8 space-y-4">
      {activeDocTypes.map((docType) => {
        const document = documents.find(
          (currentDocument) => currentDocument.docTypeId === docType.id
        )

        if (!document) {
          return null
        }

        return (
          <article
            key={docType.id}
            className="border-border/70 bg-card/80 rounded-[1.75rem] border p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-secondary text-secondary-foreground rounded-full px-3 py-1 text-xs font-medium">
                    #{docType.number}
                  </span>
                  <StatusBadge status={document.status} />
                </div>
                <h3 className="mt-3 font-medium">{docType.label}</h3>
                <p className="text-muted-foreground mt-1 text-xs tracking-[0.2em] uppercase">
                  {docType.category} • {docType.dateFormat}
                </p>
              </div>
              <div className="border-border/70 bg-background/80 min-w-56 rounded-[1.5rem] border px-4 py-3 text-sm">
                <p className="text-muted-foreground">Last used</p>
                <p className="mt-1 font-medium">
                  {latestSession?.documents.find(
                    (item) => item.docTypeId === docType.id
                  )?.dateLabel ?? "No prior value"}
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {document.dates.mode === "single" ? (
                <Field
                  label={
                    docType.category === "gdoc_photos"
                      ? "Default photo date"
                      : "Date"
                  }
                >
                  <input
                    type="date"
                    className="field"
                    value={document.dates.date}
                    onChange={(event) =>
                      onHandleDateChange(docType.id, "date", event.target.value)
                    }
                  />
                </Field>
              ) : (
                <>
                  <Field label="From date">
                    <input
                      type="date"
                      className="field"
                      value={document.dates.from}
                      onChange={(event) =>
                        onHandleDateChange(
                          docType.id,
                          "from",
                          event.target.value
                        )
                      }
                    />
                  </Field>
                  <Field label="To date">
                    <input
                      type="date"
                      className="field"
                      value={document.dates.to}
                      onChange={(event) =>
                        onHandleDateChange(docType.id, "to", event.target.value)
                      }
                    />
                  </Field>
                </>
              )}
            </div>

            {document.validationMessage ? (
              <p className="text-destructive mt-4 text-sm">
                {document.validationMessage}
              </p>
            ) : null}
          </article>
        )
      })}

      <div className="border-border/70 bg-secondary/40 flex flex-wrap items-center justify-between gap-3 rounded-[1.75rem] border px-5 py-4">
        <div>
          <p className="text-secondary-foreground text-sm font-medium">
            Email config
          </p>
          <p className="text-muted-foreground text-sm">
            To {config.email.toEmail || "not set"} • CC{" "}
            {config.email.ccEmail || "not set"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={onEditSettings}>
            <Settings2 />
            Edit settings
          </Button>
        </div>
      </div>
    </div>
  )
}

export function DriveRootFolderField({
  className,
  rootFolderError,
  rootFolderInput,
  selectedRootFolderId,
  selectedRootFolderName,
  onRootFolderInputChange,
  onSelectRootFolder,
}: {
  className?: string
  rootFolderError: string
  rootFolderInput: string
  selectedRootFolderId: string
  selectedRootFolderName?: string
  onRootFolderInputChange: (value: string) => void
  onSelectRootFolder: (folderIdOrUrl?: string) => Promise<void>
}) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isLoadingFolders, setIsLoadingFolders] = useState(false)
  const [dialogError, setDialogError] = useState("")
  const [isDriveConnected, setIsDriveConnected] = useState(() =>
    hasGoogleDriveAccessToken()
  )
  const [folderPath, setFolderPath] = useState<
    Array<{ id: string; name: string }>
  >([{ id: "root", name: "My Drive" }])
  const [folders, setFolders] = useState<GoogleDriveFile[]>([])

  async function connectDrive() {
    setIsConnecting(true)
    setDialogError("")

    try {
      await getGoogleDriveAccessToken({ interactive: true })
      setIsDriveConnected(true)
    } catch (error) {
      setDialogError(
        error instanceof Error
          ? error.message
          : "Google Drive connection failed."
      )
      throw error
    } finally {
      setIsConnecting(false)
    }
  }

  async function loadFolders(parentId: string) {
    setIsLoadingFolders(true)
    setDialogError("")

    try {
      setFolders(await listGoogleDriveFolders(parentId))
    } catch (error) {
      setDialogError(
        error instanceof Error ? error.message : "Failed to load Drive folders."
      )
    } finally {
      setIsLoadingFolders(false)
    }
  }

  async function openFolderDialog() {
    setIsDialogOpen(true)
    setFolderPath([{ id: "root", name: "My Drive" }])

    if (!isDriveConnected) {
      try {
        await connectDrive()
      } catch {
        return
      }
    }

    await loadFolders("root")
  }

  async function handleFolderSelect(
    folder: Pick<GoogleDriveFile, "id" | "name">
  ) {
    onRootFolderInputChange(folder.id)
    await onSelectRootFolder(folder.id)
    setIsDialogOpen(false)
  }

  useEffect(() => {
    setIsDriveConnected(hasGoogleDriveAccessToken())
  }, [isDialogOpen])

  return (
    <>
      <section
        className={cn(
          "border-border/70 bg-card/80 rounded-[1.75rem] border p-5",
          className
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-muted-foreground text-xs tracking-[0.24em] uppercase">
              Drive
            </p>
            <h3 className="font-heading mt-1 text-xl font-semibold">
              Root folder
            </h3>
            <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-6">
              Connect Google Drive if needed, then choose the folder to scan and
              use for generated documents.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => void connectDrive()}
              disabled={isConnecting}
            >
              {isConnecting ? <LoaderCircle className="animate-spin" /> : null}
              {isDriveConnected ? "Reconnect Drive" : "Connect Drive"}
            </Button>
            <Button
              onClick={() => void openFolderDialog()}
              disabled={isConnecting}
            >
              <FolderSearch />
              Choose folder
            </Button>
          </div>
        </div>

        <input
          className="field mt-4"
          placeholder="https://drive.google.com/drive/folders/... or folder id"
          value={rootFolderInput}
          onChange={(event) => onRootFolderInputChange(event.target.value)}
        />

        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => void onSelectRootFolder()}>
            Verify typed folder
          </Button>
        </div>

        {selectedRootFolderId ? (
          <div className="border-border/70 bg-background/70 mt-4 rounded-[1.25rem] border px-4 py-3 text-sm">
            <p className="font-medium">
              {selectedRootFolderName || "Using selected Google Drive folder"}
            </p>
            <p className="text-muted-foreground mt-1 break-all">
              {selectedRootFolderId}
            </p>
          </div>
        ) : null}

        {rootFolderError ? (
          <div className="border-destructive/20 bg-destructive/8 text-destructive mt-4 rounded-[1.25rem] border p-4 text-sm">
            {rootFolderError}
          </div>
        ) : null}
      </section>

      {isDialogOpen ? (
        <OverlayPanel
          title="Choose Google Drive folder"
          onClose={() => setIsDialogOpen(false)}
        >
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-muted-foreground text-sm leading-6">
                  Browse your Drive folders and select the workflow root folder.
                </p>
                <p className="text-muted-foreground mt-2 text-xs tracking-[0.2em] uppercase">
                  {folderPath.map((segment) => segment.name).join(" / ")}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() => void connectDrive()}
                  disabled={isConnecting}
                >
                  {isConnecting ? (
                    <LoaderCircle className="animate-spin" />
                  ) : null}
                  {isDriveConnected ? "Reconnect Drive" : "Connect Drive"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (folderPath.length <= 1) {
                      return
                    }

                    const nextPath = folderPath.slice(0, -1)
                    setFolderPath(nextPath)
                    void loadFolders(
                      nextPath[nextPath.length - 1]?.id ?? "root"
                    )
                  }}
                  disabled={folderPath.length <= 1 || isLoadingFolders}
                >
                  Back
                </Button>
              </div>
            </div>

            {dialogError ? (
              <div className="border-destructive/20 bg-destructive/8 text-destructive rounded-[1.25rem] border p-4 text-sm">
                {dialogError}
              </div>
            ) : null}

            <div className="grid gap-3">
              {isLoadingFolders ? (
                <div className="border-border/70 bg-card/80 text-muted-foreground rounded-[1.5rem] border p-5 text-sm">
                  Loading folders...
                </div>
              ) : folders.length ? (
                folders.map((folder) => (
                  <article
                    key={folder.id}
                    className="border-border/70 bg-card/80 flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] border p-4"
                  >
                    <div>
                      <p className="font-medium">{folder.name}</p>
                      <p className="text-muted-foreground mt-1 text-xs break-all">
                        {folder.id}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setFolderPath((currentPath) => [
                            ...currentPath,
                            { id: folder.id, name: folder.name },
                          ])
                          void loadFolders(folder.id)
                        }}
                      >
                        Open
                      </Button>
                      <Button onClick={() => void handleFolderSelect(folder)}>
                        Use folder
                      </Button>
                    </div>
                  </article>
                ))
              ) : (
                <div className="border-border/70 bg-card/80 text-muted-foreground rounded-[1.5rem] border p-5 text-sm">
                  No folders found here.
                </div>
              )}
            </div>
          </div>
        </OverlayPanel>
      ) : null}
    </>
  )
}

export function ScanStep({
  activeDocTypes,
  config,
  documents,
  hasScanned,
  latestSession,
  logs,
  onContinue,
  onEditSettings,
  onHandleDateChange,
  onRunScan,
  onSelectRootFolder,
  photoFiles,
  rootFolderError,
  rootFolderInput,
  selectedRootFolderId,
  selectedRootFolderName,
  setRootFolderInput,
}: {
  activeDocTypes: DocTypeConfig[]
  config: VisaConfig
  documents: WorkflowDocumentState[]
  hasScanned: boolean
  latestSession: VisaSessionRecord | undefined
  logs: string[]
  onContinue: () => void
  onEditSettings: () => void
  onHandleDateChange: (
    docTypeId: string,
    key: "date" | "from" | "to",
    value: string
  ) => void
  onRunScan: () => Promise<void>
  onSelectRootFolder: (folderIdOrUrl?: string) => Promise<void>
  photoFiles: string[]
  rootFolderError: string
  rootFolderInput: string
  selectedRootFolderId: string
  selectedRootFolderName?: string
  setRootFolderInput: (value: string) => void
}) {
  return (
    <div className="mt-8 space-y-5">
      <DriveRootFolderField
        rootFolderError={rootFolderError}
        rootFolderInput={rootFolderInput}
        selectedRootFolderId={selectedRootFolderId}
        selectedRootFolderName={selectedRootFolderName}
        onRootFolderInputChange={setRootFolderInput}
        onSelectRootFolder={onSelectRootFolder}
      />
      <SetupStep
        activeDocTypes={activeDocTypes}
        config={config}
        documents={documents}
        latestSession={latestSession}
        onEditSettings={onEditSettings}
        onHandleDateChange={onHandleDateChange}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted-foreground max-w-xl text-sm leading-6">
          Scan the Documents requested Drive tree, auto-match files against the
          seeded patterns, and confirm whether photo captioning is needed.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button onClick={onRunScan}>
            <FolderSearch />
            Scan Drive
          </Button>
        </div>
      </div>
      <div className="grid gap-3">
        {activeDocTypes.map((docType) => {
          const document = documents.find(
            (currentDocument) => currentDocument.docTypeId === docType.id
          )

          if (!document) {
            return null
          }

          return (
            <div
              key={docType.id}
              className="border-border/70 bg-card/80 rounded-[1.5rem] border px-4 py-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{docType.label}</p>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {document.matchedFiles.length || 0} file(s) matched
                  </p>
                </div>
                <StatusBadge status={document.status} />
              </div>
              {document.matchedFiles.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {document.matchedFiles.map((fileName) => (
                    <span
                      key={fileName}
                      className="border-border/70 bg-background text-muted-foreground rounded-full border px-3 py-1 text-xs"
                    >
                      {fileName}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          )
        })}
      </div>
      <LogPanel
        title="Drive scan log"
        entries={logs}
        emptyMessage="Scan output will stream here."
      />
      {hasScanned ? (
        <div className="flex justify-end">
          <Button onClick={onContinue}>
            {photoFiles.length
              ? "Continue to photo captions"
              : "Skip to generate documents"}
            <ChevronRight />
          </Button>
        </div>
      ) : null}
    </div>
  )
}
