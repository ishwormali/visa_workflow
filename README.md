# TanStack Start + shadcn/ui

This is a template for a new TanStack Start project with React, TypeScript, and shadcn/ui.

## Google Drive and Gmail setup

1. Create a Google Cloud project.
2. Enable Google Drive API and Gmail API.
3. Configure OAuth consent screen and add test users.
   - Current test user: ishanbuddy@gmail.com
4. Create OAuth client credentials (Web application).
5. Copy `.env.example` to `.env.local` and set values.
6. Set `VITE_GOOGLE_DRIVE_ROOT_FOLDER_ID` to the Drive folder the workflow should scan.
7. Set `VITE_GOOGLE_DRIVE_DOCUMENT_LIST_FILE_ID` to the Drive file that stores the `Document list` table.

Important:

- `VITE_GOOGLE_CLIENT_ID` and `VITE_GOOGLE_SCOPES` are client-side settings.
- `VITE_GOOGLE_DRIVE_ROOT_FOLDER_ID` and `VITE_GOOGLE_DRIVE_DOCUMENT_LIST_FILE_ID` are also client-side settings.
- `GOOGLE_CLIENT_SECRET` is server-only and must never be exposed in browser code.

The app now uses Google Identity Services in the browser to authorize Drive access, then calls the Google Drive REST API directly for document list reads, recursive scans, folder creation, Google Doc creation, downloads, and file moves.

Notes:

- The workflow scans existing files and also creates or moves Drive files, so `VITE_GOOGLE_SCOPES` should include `https://www.googleapis.com/auth/drive`.
- The current browser token flow does not use `VITE_GOOGLE_REDIRECT_URI`.

Current limitation:

- Gmail draft creation still uses the existing local stub after Drive files are downloaded.

## Adding components

To add components to your app, run the following command:

```bash
npx shadcn@latest add button
```

This will place the ui components in the `components` directory.

## Using components

To use the components in your app, import them as follows:

```tsx
import { Button } from "@/components/ui/button";
```
