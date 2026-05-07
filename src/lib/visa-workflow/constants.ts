import type { EmailConfig } from "./types"

export const VISA_CONFIG_KEY = "visa_config"
export const VISA_SESSIONS_KEY = "visa_sessions"

export const DEFAULT_EMAIL_CONFIG: EmailConfig = {
  toEmail: "",
  ccEmail: "",
  greeting: "Team",
  signOff: "Applicant",
}

export const SAMPLE_DOCUMENT_LIST = `| No | Document | Status | Attachment |
| 1 | Sponsor letter | | 1 - sponsor letter.pdf |
| 2 | Passport copies | | 2 - passport.pdf |
| 3 | Employment letters | | 3 - employment.pdf |
| 4 | Joint statements from January to current | | 4 - savers account.pdf\n4 - smart account.pdf |
| 5 | Travel itinerary | | 5 - itinerary.pdf |
| 6 | Proof of address | | 6 - address.pdf |
| 7 | WhatsApp chat history from January to current | | 7 - Whatsapp export.zip |
| 8 | Photographs of relationship | | 8 - Photograph collage.jpg |`

export const SAMPLE_DRIVE_FILES = [
  "4 - savers account - Apr 2026.pdf",
  "4 - smart account - Apr 2026.pdf",
  "7 - Whatsapp export - Apr 2026.zip",
  "8 - Photograph - picnic.jpg",
  "8 - Photograph - wedding.jpg",
]
