import { FolderSearch, LoaderCircle } from "lucide-react"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  getGoogleDriveAccessToken,
  hasGoogleDriveAccessToken,
  listGoogleDriveFolders,
  type GoogleDriveFile,
} from "@/lib/google-drive"
import { cn } from "@/lib/utils"

import { LogPanel, OverlayPanel } from "./shared"

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
  logs,
  onRunScan,
  onCreateVisaFolder,
  rawFolderFiles,
  rawFolderId,
  rawFolderMissing,
  visaFolderId,
  visaFolderMissing,
  visaFolderName,
}: {
  logs: string[]
  onRunScan: () => Promise<void>
  onCreateVisaFolder: () => Promise<void>
  rawFolderFiles: GoogleDriveFile[]
  rawFolderId: string
  rawFolderMissing: boolean
  visaFolderId: string
  visaFolderMissing: boolean
  visaFolderName: string
}) {
  return (
    <div className="mt-8 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted-foreground max-w-xl text-sm leading-6">
          Find the Visa month folder using the selected to-date and then check
          the raw folder for available documents.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button onClick={onRunScan}>
            <FolderSearch />
            Find Visa folder
          </Button>
          {visaFolderMissing ? (
            <Button variant="outline" onClick={onCreateVisaFolder}>
              Create folder
            </Button>
          ) : null}
        </div>
      </div>

      {visaFolderId ? (
        <div className="border-border/70 bg-card/80 rounded-[1.5rem] border p-4">
          <p className="font-medium">Visa folder found</p>
          <p className="text-muted-foreground mt-1 text-sm">{visaFolderName}</p>
          <p className="text-muted-foreground mt-1 text-xs break-all">
            {visaFolderId}
          </p>
        </div>
      ) : null}

      {rawFolderMissing ? (
        <div className="rounded-[1.5rem] border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-800">
          Raw folder was not found in the selected Visa folder.
        </div>
      ) : null}

      {rawFolderId ? (
        <div className="border-border/70 bg-card/80 rounded-[1.5rem] border p-4">
          <p className="font-medium">Raw folder detected</p>
          <p className="text-muted-foreground mt-1 text-xs break-all">
            {rawFolderId}
          </p>
          <p className="text-muted-foreground mt-3 text-sm">
            {rawFolderFiles.length} file(s) found in raw.
          </p>
          {rawFolderFiles.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {rawFolderFiles.map((file) => (
                <span
                  key={file.id}
                  className="border-border/70 bg-background text-muted-foreground rounded-full border px-3 py-1 text-xs"
                >
                  {file.name}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      <LogPanel
        title="Visa folder log"
        entries={logs}
        emptyMessage="Folder lookup output will appear here."
      />
    </div>
  )
}
