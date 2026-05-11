import { readGoogleOAuthConfig } from "./google-oauth";

const DRIVE_API_BASE_URL = "https://www.googleapis.com/drive/v3";
const DRIVE_UPLOAD_BASE_URL = "https://www.googleapis.com/upload/drive/v3";
const GOOGLE_IDENTITY_SCRIPT_URL = "https://accounts.google.com/gsi/client";
const GOOGLE_DRIVE_FOLDER_MIME_TYPE = "application/vnd.google-apps.folder";
const GOOGLE_DOC_MIME_TYPE = "application/vnd.google-apps.document";
const TOKEN_STORAGE_KEY = "google_drive_access_token";

type CachedToken = {
  accessToken: string;
  expiresAt: number;
  scopes: string[];
};

type TokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
  expires_in?: number;
  scope?: string;
};

type TokenClient = {
  requestAccessToken: (options?: { prompt?: string }) => void;
};

type GoogleIdentityServices = {
  accounts?: {
    oauth2?: {
      initTokenClient: (config: {
        client_id: string;
        scope: string;
        callback: (response: TokenResponse) => void;
        prompt?: string;
        error_callback?: (error: { message?: string; type?: string }) => void;
      }) => TokenClient;
      revoke: (token: string, callback?: () => void) => void;
    };
  };
};

export type GoogleDriveFile = {
  id: string;
  name: string;
  mimeType: string;
  parents?: string[];
};

type DriveListResponse = {
  files: GoogleDriveFile[];
  nextPageToken?: string;
};

declare global {
  interface Window {
    google?: GoogleIdentityServices;
  }
}

let googleIdentityScriptPromise: Promise<void> | null = null;
let tokenRequestPromise: Promise<string> | null = null;
let pdfJsPromise: Promise<typeof import("pdfjs-dist/legacy/build/pdf.mjs")> | null = null;

function assertBrowser() {
  if (typeof window === "undefined") {
    throw new Error("Google Drive integration is only available in the browser.");
  }
}

function getSessionStorage() {
  assertBrowser();

  return window.sessionStorage;
}

function readDriveEnv(
  name: "VITE_GOOGLE_DRIVE_ROOT_FOLDER_ID" | "VITE_GOOGLE_DRIVE_DOCUMENT_LIST_FILE_ID",
) {
  const value = import.meta.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function readOptionalDriveEnv(
  name: "VITE_GOOGLE_DRIVE_ROOT_FOLDER_ID" | "VITE_GOOGLE_DRIVE_DOCUMENT_LIST_FILE_ID",
) {
  const value = import.meta.env[name]?.trim();

  return value || undefined;
}

function readCachedToken() {
  const rawValue = getSessionStorage().getItem(TOKEN_STORAGE_KEY);

  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as CachedToken;
    const requiredScopes = new Set(readGoogleOAuthConfig().scopes);
    const cachedScopes = new Set(parsed.scopes ?? []);

    if (
      !parsed.accessToken ||
      parsed.expiresAt <= Date.now() ||
      [...requiredScopes].some((scope) => !cachedScopes.has(scope))
    ) {
      getSessionStorage().removeItem(TOKEN_STORAGE_KEY);
      return null;
    }

    return parsed;
  } catch {
    getSessionStorage().removeItem(TOKEN_STORAGE_KEY);
    return null;
  }
}

function writeCachedToken(
  response: Required<Pick<TokenResponse, "access_token" | "expires_in">> & {
    scope?: string;
  },
) {
  const configuredScopes = readGoogleOAuthConfig().scopes;
  const cachedToken: CachedToken = {
    accessToken: response.access_token,
    expiresAt: Date.now() + response.expires_in * 1000 - 60_000,
    scopes: response.scope ? response.scope.split(/\s+/).filter(Boolean) : configuredScopes,
  };

  getSessionStorage().setItem(TOKEN_STORAGE_KEY, JSON.stringify(cachedToken));

  return cachedToken.accessToken;
}

async function loadGoogleIdentityScript() {
  assertBrowser();

  if (window.google?.accounts?.oauth2) {
    return;
  }

  if (!googleIdentityScriptPromise) {
    googleIdentityScriptPromise = new Promise((resolve, reject) => {
      const existingScript = document.querySelector<HTMLScriptElement>(
        `script[src="${GOOGLE_IDENTITY_SCRIPT_URL}"]`,
      );

      if (existingScript) {
        existingScript.addEventListener("load", () => resolve(), {
          once: true,
        });
        existingScript.addEventListener(
          "error",
          () => reject(new Error("Failed to load Google Identity Services.")),
          { once: true },
        );

        return;
      }

      const script = document.createElement("script");
      script.src = GOOGLE_IDENTITY_SCRIPT_URL;
      script.async = true;
      script.defer = true;
      script.addEventListener("load", () => resolve(), { once: true });
      script.addEventListener(
        "error",
        () => {
          reject(new Error("Failed to load Google Identity Services."));
        },
        { once: true },
      );
      document.head.append(script);
    });
  }

  await googleIdentityScriptPromise;

  if (!window.google?.accounts?.oauth2) {
    throw new Error("Google Identity Services did not initialize correctly.");
  }
}

export async function getGoogleDriveAccessToken(options: { interactive?: boolean } = {}) {
  const cachedToken = readCachedToken();

  if (cachedToken) {
    return cachedToken.accessToken;
  }

  await loadGoogleIdentityScript();

  const googleOAuth = window.google?.accounts?.oauth2;

  if (!googleOAuth) {
    throw new Error("Google Identity Services is unavailable.");
  }

  if (!tokenRequestPromise) {
    tokenRequestPromise = new Promise<string>((resolve, reject) => {
      const { clientId, scopes } = readGoogleOAuthConfig();
      const tokenClient = googleOAuth.initTokenClient({
        client_id: clientId,
        scope: scopes.join(" "),
        prompt: options.interactive === false ? "" : "consent",
        callback: (response) => {
          if (response.error) {
            reject(
              new Error(
                response.error_description ?? response.error ?? "Google authorization failed.",
              ),
            );
            return;
          }

          if (!response.access_token || !response.expires_in) {
            reject(new Error("Google authorization response did not include an access token."));
            return;
          }

          resolve(
            writeCachedToken({
              access_token: response.access_token,
              expires_in: response.expires_in,
              scope: response.scope,
            }),
          );
        },
        error_callback: (error) => {
          reject(new Error(error.message ?? error.type ?? "Google authorization failed."));
        },
      });

      tokenClient.requestAccessToken({
        prompt: options.interactive === false ? "" : "consent",
      });
    }).finally(() => {
      tokenRequestPromise = null;
    });
  }

  return tokenRequestPromise;
}

export function hasGoogleDriveAccessToken() {
  return Boolean(readCachedToken());
}

async function driveFetch(
  input: string,
  init?: RequestInit & { responseType?: "json" | "text" | "arrayBuffer" },
) {
  const accessToken = await getGoogleDriveAccessToken();
  const response = await fetch(input, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Google Drive request failed (${response.status}): ${errorBody || response.statusText}`,
    );
  }

  if (init?.responseType === "text") {
    return response.text();
  }

  if (init?.responseType === "arrayBuffer") {
    return response.arrayBuffer();
  }

  return response.json();
}

async function loadPdfJs() {
  if (!pdfJsPromise) {
    pdfJsPromise = Promise.all([
      import("pdfjs-dist/legacy/build/pdf.mjs"),
      import("pdfjs-dist/build/pdf.worker.min.mjs?url"),
    ]).then(([pdfJs, workerModule]) => {
      pdfJs.GlobalWorkerOptions.workerSrc = workerModule.default;

      return pdfJs;
    });
  }

  return pdfJsPromise;
}

export async function readGoogleDriveDocumentList(rootFolderId?: string) {
  const fileId = rootFolderId
    ? (
        await findGoogleDriveFileRecursively({
          folderId: rootFolderId,
          fileName: "Document list",
        })
      )?.id
    : readOptionalDriveEnv("VITE_GOOGLE_DRIVE_DOCUMENT_LIST_FILE_ID");

  if (!fileId) {
    throw new Error(
      rootFolderId
        ? 'Could not find a "Document list" file under the selected Google Drive root folder.'
        : "Missing required environment variable: VITE_GOOGLE_DRIVE_DOCUMENT_LIST_FILE_ID",
    );
  }

  const file = (await driveFetch(
    `${DRIVE_API_BASE_URL}/files/${fileId}?fields=id,name,mimeType`,
  )) as Pick<GoogleDriveFile, "id" | "name" | "mimeType">;

  if (file.mimeType === GOOGLE_DOC_MIME_TYPE) {
    return driveFetch(
      `${DRIVE_API_BASE_URL}/files/${fileId}/export?mimeType=${encodeURIComponent("text/plain")}`,
      { responseType: "text" },
    );
  }

  return driveFetch(`${DRIVE_API_BASE_URL}/files/${fileId}?alt=media`, {
    responseType: "text",
  });
}

export async function readGoogleDriveFileMetadata(fileId: string) {
  return driveFetch(
    `${DRIVE_API_BASE_URL}/files/${fileId}?fields=id,name,mimeType,parents&supportsAllDrives=true`,
  ) as Promise<GoogleDriveFile>;
}

async function listDriveFolderPage(folderId: string, pageToken?: string) {
  const params = new URLSearchParams({
    q: `'${folderId}' in parents and trashed = false`,
    fields: "nextPageToken,files(id,name,mimeType,parents)",
    orderBy: "folder,name_natural",
    pageSize: "1000",
    supportsAllDrives: "true",
    includeItemsFromAllDrives: "true",
  });

  if (pageToken) {
    params.set("pageToken", pageToken);
  }

  return driveFetch(
    `${DRIVE_API_BASE_URL}/files?${params.toString()}`,
  ) as Promise<DriveListResponse>;
}

function normalizeDriveFileName(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/\.[^.]+$/, "");
}

async function findGoogleDriveFileRecursively(args: { folderId: string; fileName: string }) {
  const normalizedTargetName = normalizeDriveFileName(args.fileName);
  const queue = [args.folderId];

  while (queue.length) {
    const currentFolderId = queue.shift();

    if (!currentFolderId) {
      continue;
    }

    let pageToken: string | undefined;

    do {
      const response = await listDriveFolderPage(currentFolderId, pageToken);

      for (const file of response.files) {
        if (file.mimeType === GOOGLE_DRIVE_FOLDER_MIME_TYPE) {
          queue.push(file.id);
          continue;
        }

        if (normalizeDriveFileName(file.name) === normalizedTargetName) {
          return file;
        }
      }

      pageToken = response.nextPageToken;
    } while (pageToken);
  }

  return null;
}

export async function listGoogleDriveFolders(parentId = "root") {
  let pageToken: string | undefined;
  const folders: GoogleDriveFile[] = [];

  do {
    const params = new URLSearchParams({
      q: `'${parentId}' in parents and mimeType = '${GOOGLE_DRIVE_FOLDER_MIME_TYPE}' and trashed = false`,
      fields: "nextPageToken,files(id,name,mimeType,parents)",
      orderBy: "name_natural",
      pageSize: "200",
      supportsAllDrives: "true",
      includeItemsFromAllDrives: "true",
    });

    if (pageToken) {
      params.set("pageToken", pageToken);
    }

    const response = (await driveFetch(
      `${DRIVE_API_BASE_URL}/files?${params.toString()}`,
    )) as DriveListResponse;

    folders.push(...response.files);
    pageToken = response.nextPageToken;
  } while (pageToken);

  return folders;
}

export async function listGoogleDriveFilesRecursively(
  folderId = readDriveEnv("VITE_GOOGLE_DRIVE_ROOT_FOLDER_ID"),
) {
  const queue = [folderId];
  const files: GoogleDriveFile[] = [];

  while (queue.length) {
    const currentFolderId = queue.shift();

    if (!currentFolderId) {
      continue;
    }

    let pageToken: string | undefined;

    do {
      const response = await listDriveFolderPage(currentFolderId, pageToken);

      for (const file of response.files) {
        files.push(file);

        if (file.mimeType === GOOGLE_DRIVE_FOLDER_MIME_TYPE) {
          queue.push(file.id);
        }
      }

      pageToken = response.nextPageToken;
    } while (pageToken);
  }

  return files.filter((file) => file.mimeType !== GOOGLE_DRIVE_FOLDER_MIME_TYPE);
}

export async function createGoogleDriveFolder(
  name: string,
  parentId = readDriveEnv("VITE_GOOGLE_DRIVE_ROOT_FOLDER_ID"),
) {
  const response = (await driveFetch(`${DRIVE_API_BASE_URL}/files?supportsAllDrives=true`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      mimeType: GOOGLE_DRIVE_FOLDER_MIME_TYPE,
      parents: [parentId],
    }),
  })) as GoogleDriveFile;

  return response;
}

export async function copyGoogleDriveFile(args: {
  fileId: string;
  name: string;
  parentId: string;
}) {
  return (await driveFetch(
    `${DRIVE_API_BASE_URL}/files/${args.fileId}/copy?supportsAllDrives=true`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: args.name,
        parents: [args.parentId],
      }),
    },
  )) as GoogleDriveFile;
}

function buildMultipartBody(metadata: Record<string, unknown>, content: string) {
  const boundary = `visa-workflow-${crypto.randomUUID()}`;
  const body = [
    `--${boundary}`,
    "Content-Type: application/json; charset=UTF-8",
    "",
    JSON.stringify(metadata),
    `--${boundary}`,
    "Content-Type: text/plain; charset=UTF-8",
    "",
    content,
    `--${boundary}--`,
    "",
  ].join("\r\n");

  return { boundary, body };
}

export async function createGoogleDocInDrive(args: {
  name: string;
  parentId: string;
  content: string;
}) {
  const { boundary, body } = buildMultipartBody(
    {
      name: args.name,
      mimeType: GOOGLE_DOC_MIME_TYPE,
      parents: [args.parentId],
    },
    args.content,
  );

  return (await driveFetch(
    `${DRIVE_UPLOAD_BASE_URL}/files?uploadType=multipart&supportsAllDrives=true`,
    {
      method: "POST",
      headers: {
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body,
    },
  )) as GoogleDriveFile;
}

export async function downloadGoogleDriveFileAsBase64(
  file: Pick<GoogleDriveFile, "id" | "mimeType">,
) {
  const bytes = new Uint8Array(await downloadGoogleDriveFileAsArrayBuffer(file));

  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
}

export async function downloadGoogleDriveFileAsArrayBuffer(
  file: Pick<GoogleDriveFile, "id" | "mimeType">,
) {
  return file.mimeType === GOOGLE_DOC_MIME_TYPE
    ? driveFetch(
        `${DRIVE_API_BASE_URL}/files/${file.id}/export?mimeType=${encodeURIComponent("text/plain")}`,
        { responseType: "arrayBuffer" },
      )
    : driveFetch(`${DRIVE_API_BASE_URL}/files/${file.id}?alt=media`, {
        responseType: "arrayBuffer",
      });
}

export async function readGoogleDrivePdfText(file: Pick<GoogleDriveFile, "id" | "mimeType">) {
  const pdfJs = await loadPdfJs();
  const pdfBytes = new Uint8Array(await downloadGoogleDriveFileAsArrayBuffer(file));
  const pdfDocument = await pdfJs.getDocument({ data: pdfBytes }).promise;
  const pages: string[] = [];

  try {
    for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
      const page = await pdfDocument.getPage(pageNumber);

      try {
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item) => ("str" in item ? item.str : ""))
          .filter(Boolean)
          .join(" ");

        pages.push(pageText);
      } finally {
        page.cleanup();
      }
    }
  } finally {
    await pdfDocument.destroy();
  }

  return pages.join("\n");
}

export async function moveGoogleDriveFile(args: {
  fileId: string;
  addParentId: string;
  removeParentIds?: string[];
}) {
  const params = new URLSearchParams({
    addParents: args.addParentId,
    supportsAllDrives: "true",
  });

  if (args.removeParentIds?.length) {
    params.set("removeParents", args.removeParentIds.join(","));
  }

  return (await driveFetch(`${DRIVE_API_BASE_URL}/files/${args.fileId}?${params.toString()}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  })) as GoogleDriveFile;
}

export function readGoogleDriveRootFolderId() {
  return readDriveEnv("VITE_GOOGLE_DRIVE_ROOT_FOLDER_ID");
}

export function readGoogleDriveDefaultRootFolderId() {
  return readOptionalDriveEnv("VITE_GOOGLE_DRIVE_ROOT_FOLDER_ID");
}

export async function revokeGoogleDriveAccess() {
  const cachedToken = readCachedToken();

  getSessionStorage().removeItem(TOKEN_STORAGE_KEY);

  if (cachedToken && window.google?.accounts?.oauth2?.revoke) {
    window.google.accounts.oauth2.revoke(cachedToken.accessToken);
  }
}
