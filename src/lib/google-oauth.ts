export type GoogleOAuthConfig = {
  clientId: string;
  scopes: string[];
};

const DRIVE_FILE_SCOPE = "https://www.googleapis.com/auth/drive.file";
const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive";

function splitScopes(rawScopes: string) {
  return rawScopes
    .split(/[\s,]+/)
    .map((scope) => scope.trim())
    .filter(Boolean);
}

function readClientEnv(name: "VITE_GOOGLE_CLIENT_ID") {
  const value = import.meta.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function readGoogleOAuthConfig(): GoogleOAuthConfig {
  const defaultScopes = [
    "openid",
    "email",
    "profile",
    DRIVE_SCOPE,
    "https://www.googleapis.com/auth/gmail.compose",
  ];

  const configuredScopes = import.meta.env.VITE_GOOGLE_SCOPES
    ? splitScopes(import.meta.env.VITE_GOOGLE_SCOPES)
    : defaultScopes;

  const normalizedScopes = configuredScopes.includes(DRIVE_FILE_SCOPE)
    ? configuredScopes.map((scope) => (scope === DRIVE_FILE_SCOPE ? DRIVE_SCOPE : scope))
    : configuredScopes;

  return {
    clientId: readClientEnv("VITE_GOOGLE_CLIENT_ID"),
    scopes: [...new Set(normalizedScopes)],
  };
}
