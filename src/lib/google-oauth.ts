export type GoogleOAuthConfig = {
  clientId: string;
  scopes: string[];
};

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
    "https://www.googleapis.com/auth/drive.file",
    "https://www.googleapis.com/auth/drive.metadata.readonly",
    "https://www.googleapis.com/auth/gmail.compose",
  ];

  const configuredScopes = import.meta.env.VITE_GOOGLE_SCOPES
    ? splitScopes(import.meta.env.VITE_GOOGLE_SCOPES)
    : defaultScopes;

  return {
    clientId: readClientEnv("VITE_GOOGLE_CLIENT_ID"),
    scopes: configuredScopes,
  };
}
