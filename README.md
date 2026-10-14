# Globe Unified Platform Demo

A clickable concept mockup of **Globe AI Studio**: a self-service platform where Globe's merchants sign in and build AI voice, chat and agentic-flow agents. Behind the scenes it is powered by **NEO**, with Globe hosting the NEO environment and providing telephony.

Everything is simulated in the browser. No real email, NEO, or telephony calls are made.

## Run it

No install or build step is needed.

- **Simplest:** open `merchant-studio/index.html` in a browser.
- **On localhost:** run `merchant-studio/start.bat` (Windows) or `merchant-studio/start.command` (macOS/Linux). This serves the app on http://localhost:4173 using Node.js or Python.

Start screen: **Existing Merchant** (demo login `ops@neofoodresto.com.ph`; the one-time code appears in the simulated inbox pop-up) or **Register Now** (search a sample merchant such as "Jollibee", then verify an email on its domain, e.g. `ops@jollibee.com.ph`).

## What it shows

1. **Register or sign in.** New merchants pick their business from a directory of 100 sample Philippine merchants (25 per industry) and verify a work email on its domain, in a simulated check. Existing merchants sign in with an email code. Each merchant only sees its own agents.
2. **Build:** after sign-in, merchants land on the 10 voice-first templates for their industry (Food Service, Retail, Banking/Lending or Healthcare). **See all templates** shows all 40. The industry can be changed from **Profile**. A "Want to build something else?" link leads to a prompt page, which generates a NEO import JSON and "imports" it.
3. **My Services:** the merchant starts with three live agents. Double-click one to open it, or select one and click **Trigger** to upload a CSV, then fill in NEO-style **Schedule Details** (name, days of week, period, Start Immediately). The required CSV headers are the agent's variables, mirroring NEO.
4. **Each agent** has a test call or chat, call logs, schedules with simulated progress, and the generated JSON. Agents are **editable**: Save & republish creates a new version, and older versions can be restored. Running schedules keep the version they started with.

## Repository layout

| Path | What it is |
|---|---|
| `merchant-studio/` | The app: static HTML/CSS/JS, works offline and from `file://` |
| `merchant-studio/assets/neo-export.js` | Builds NEO voice / chat / flow import JSON |
| `merchant-studio/assets/data.js` | Industries, templates, demo merchant detection |
| `neo-export-samples/` | Redacted real NEO exports used as the reference for the JSON structure |
| `package.ps1` | Zips `merchant-studio/` into `dist/` for sharing |

## Notes

- **Generated NEO JSON** follows the structure of the samples. Credentials and workspace IDs are placeholders, the Globe telephony config is `<globe-telephony-provider>`, and flow files leave out component code. It has not been tested against a live NEO import.
- **Prompt-to-agent** matches keywords; no AI model is called.
- **Samples** in `neo-export-samples/` have keys, auth headers, credential references, internal hosts and workspace IDs replaced with `<redacted>`-style placeholders.
- **Merchant directory:** the names are real Philippine businesses used for illustration only, with no affiliation implied. The domains are best guesses.
- **Branding:** the Globe name and logo are trademarks of Globe Telecom. Styling follows Globe's site and its Kinetic design system. Globe's typeface (FS Elliot Pro) is licensed and not included.
