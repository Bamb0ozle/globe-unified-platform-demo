# Globe Unified Platform Demo

A clickable concept mockup of **Globe AI Studio**: a self-service platform where Globe's merchants sign in and build AI voice, chat and agentic-flow agents. Behind the scenes it is powered by **NEO**, with Globe hosting the NEO environment and providing telephony.

Everything is simulated in the browser. No real email, NEO, or telephony calls are made.

## Run it

No install or build step is needed.

- **Simplest:** open `merchant-studio/index.html` in a browser.
- **On localhost:** run `merchant-studio/start.bat` (Windows) or `merchant-studio/start.command` (macOS/Linux). This serves the app on http://localhost:4173 using Node.js or Python.

Demo login: `ops@neofoodresto.com.ph`. The one-time code appears in the simulated inbox pop-up.

## What it shows

1. **Sign in with an email code.** Personal domains are rejected, and the merchant and industry are detected from the domain.
2. **"What do you want to build today?"**
   - **Templates:** 10 voice-first use cases each for Food Service, Retail, Banking/Lending and Healthcare.
   - **Prompt:** describe an agent, and the app generates a NEO import JSON and "imports" it.
3. **After deploying:** a simulated deploy, a test call or chat, call logs, an outbound campaign (CSV with `customer_phone`), and the generated JSON.

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
- **Branding:** the Globe name and logo are trademarks of Globe Telecom. Styling follows Globe's site and its Kinetic design system. Globe's typeface (FS Elliot Pro) is licensed and not included.
