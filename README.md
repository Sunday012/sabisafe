# SabiSafe

An installable, mobile-first scam safety PWA for Nigerian messages, screenshots, links, call recordings, and payment evidence. Built with React and strict TypeScript.

## Run locally

```bash
npm install
npm run dev
```

For an installable production preview:

```bash
npm run build
npm run preview
```

Open the HTTPS deployment or local preview in a supporting browser and choose **Install app** when offered. On iPhone and iPad, use the browser Share menu and **Add to Home Screen**. The service worker caches the application shell, so previously loaded core checks remain available without a connection.

## Demo

Choose **Message Guard** and click **Load phishing example**, then analyse it. Switch the explanation between English and Pidgin, or try Screenshot, Link, Call, and Payment Guards.

The MVP uses a transparent rule-based detection engine, Tesseract.js for in-browser OCR, and Transformers.js with Whisper for local call transcription. No API key is required. OCR and transcription resources must be downloaded before those tools can work offline for the first time.

## PWA capabilities

- Installable manifest with standard, Apple touch, and maskable icons
- Standalone mobile display and device safe-area support
- Offline application shell and runtime caching for same-origin assets
- Browser-native install prompt where `beforeinstallprompt` is supported
- Mobile and desktop responsive layouts
- Local-only history that remains disabled until the user opts in

## Accounts and synced history

Accounts are optional. Guests can use every safety tool without signing in and may keep history only in their current browser. Signed-in users get account-scoped history that follows them across devices. Existing guest checks are merged into the account on the first login, and the local account cache is removed on logout.

SabiSafe uses Supabase Auth and a Row Level Security-protected `safety_checks` table:

1. Create a Supabase project and run [`supabase/migrations/202609280001_account_history.sql`](supabase/migrations/202609280001_account_history.sql) in its SQL editor.
2. Copy `.env.example` to `.env`.
3. Add the project URL and public anon key. Never place a Supabase service-role key in the web app.
4. Restart the development server.

```bash
cp .env.example .env
npm run dev
```

Without those environment values, the profile sheet stays available in setup mode and clearly reports that account sync has not been connected.

## Responsive product experience

SabiSafe deliberately uses two entry experiences instead of shrinking the desktop page onto a phone:

- **Mobile:** a three-step first-run introduction explains the product, shows how evidence becomes a risk result, and captures language, main safety concern, and history consent. Returning users open directly into an app-style home screen with five guard shortcuts and fixed bottom navigation.
- **Desktop:** a full marketing landing page explains the value proposition first. Its primary action opens the wider safety dashboard and analysis workspace.
- **Shared engine:** both experiences use the same TypeScript risk pipeline, reports, history, and English/Pidgin explanations. Preferences are stored only in the browser.

The interface uses one indigo/blue-violet product identity with translucent glass highlights. Green is reserved for genuinely safe or successful states. Styling is built with Tailwind CSS, with a small component stylesheet retained for complex illustrations, pseudo-elements, and print behaviour.

## Core concept: evidence-first risk analysis

SabiSafe does not let one opaque function jump directly from input to verdict.
Its fraud-intelligence pipeline separates four concerns:

1. **Detectors** turn message language and URLs into structured evidence.
2. **Risk policy** assigns explicit points and models dangerous combinations,
   such as urgency paired with a request for an OTP.
3. **Explanation** preserves source, severity, excerpt, and contribution so a
   user or auditor can reconstruct the decision.
4. **Presentation** translates the same evidence into English or Nigerian
   Pidgin without changing the underlying verdict.

This evidence-first pattern is reusable for transaction monitoring, content
moderation, account-takeover prevention, and marketplace trust and safety.

```text
message / screenshot / link / call / payment
      │
      ├── language detector ──┐
      ├── URL intelligence ───┤
      └── payment evidence ───┤
                              ▼
                    structured evidence
                              │
                  interaction-aware policy
                              │
                score + confidence + trace
                              │
               English / Pidgin explanation
```

Run the policy tests with `npm test`.

Run `npm run typecheck` to validate the complete TypeScript project without emitting files.
