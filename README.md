# SabiSafe

AI-assisted scam detection for Nigerian messages, links, screenshots, and call recordings.

## Run locally

```bash
npm install
npm run dev
```

## Demo

Choose **Message Guard** and click **Try an example**, then analyse it. Switch the explanation between English and Pidgin, or try Link Guard and Call Guard.

The MVP uses a transparent rule-based detection engine and Tesseract.js for in-browser screenshot OCR. No API key is required.

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
message / link
      │
      ├── language detector ──┐
      └── URL intelligence ───┤
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
