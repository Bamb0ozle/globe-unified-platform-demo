# Globe Unified Platform Demo

A clickable concept mockup of **Globe AI Studio for Business**. Enterprises can register, sign in, and build AI voice, chat, and agentic-flow agents.

The proposed platform uses **NEO**, with Globe hosting NEO in its AWS account and providing telephony. This repository contains the browser mockup. Email verification, deployment, analytics, schedules, and calls are simulated. The app makes no real email, NEO, or telephony calls.

This is the single project guide. Commands and paths below are relative to the repository root, unless stated otherwise.

## Run it

No application dependencies or build step are needed. The bundled application and recordings work offline.

If you do not have the project yet, clone it and enter the folder:

```sh
git clone https://github.com/Bamb0ozle/globe-unified-platform-demo.git
cd globe-unified-platform-demo
```

With Node.js installed, start the local server:

```sh
node merchant-studio/server.js
```

The server opens the browser at http://localhost:4173. If that port is occupied, it tries subsequent ports through 4190. Use the URL printed in the terminal. Press Ctrl+C to stop.

To select a port and prevent automatic browser opening:

```sh
node merchant-studio/server.js 4180 --no-open
```

You can also open `merchant-studio/index.html` directly. If the browser reports that password verification is unavailable, use the local server.

The Node.js server supports the audio byte-range requests used for Safari loading and seeking. Share the project through Git.

## Entry gate and language

An entry password is required on every page load, including direct links and saved enterprise sessions. Ask the demo owner for the password. Matching is case-sensitive and includes whitespace. The application scripts load only after verification. This browser-only gate does not protect source files on static hosting; use server-side authentication for enforced access protection.

The plaintext password is not stored in the source. `merchant-studio/assets/entry-gate.js` compares its SHA-256 hash in the browser. The stored hash and client-side check are fixed demo credentials. Direct file access and browser tools can bypass this gate. The local server serves static files and does not implement authentication.

After the password gate: **Existing Enterprise** (demo login `ops@neofoodresto.com.ph`; the one-time code appears in the simulated inbox pop-up) or **Register Now** (search a sample enterprise such as "Jollibee", then verify an email on its domain, e.g. `ops@jollibee.com.ph`).

Use **EN (English)** or **tl (Tagalog)** on the entry gate, sign-in screens, or app header to change the interface language. The choice is saved for the next visit. Screens, messages, templates, default form content, and sample conversations are translated. Switching languages preserves current form entries. CSV headers, user content, and NEO JSON retain their original values. Agent setup starts with **Agent Information**.

Interface language, an agent's configured conversation language, and KYC recording language are separate choices. Agent languages are English, Filipino, and Taglish. The interface uses **Enterprise** in English and **Kumpanya** in Tagalog. **Agent Information** becomes **Impormasyon ng Ahente**.

## What it shows

1. **Register or sign in.** New enterprises choose a business from a directory of 100 Philippine enterprises, with 25 per industry. Work-email verification is simulated. Existing enterprises sign in with an email code. The demo filters agents by enterprise domain.
2. **Build:** after sign-in, enterprises land on the 10 voice-first templates for their industry (Food Service, Retail, Banking/Lending or Healthcare). **See all templates** shows all 40. The industry can be changed from **Profile**. A "Want to build something else?" link leads to a prompt page, which generates a NEO import JSON and "imports" it.
3. **My Services:** the enterprise starts with three live agents. Double-click one to open it, or select one and click **Trigger** to upload a CSV, then fill in NEO-style **Schedule Details** (name, days of week, period, Start Immediately). The required CSV headers are the agent's variables, mirroring NEO.
4. **Each agent** has a test call or chat, call logs, schedules with simulated progress, versions, and generated JSON. **Save & republish** creates a new version. Restoring an older version republishes it as the newest version. Each schedule keeps the version assigned when that schedule was created.

The 40 templates cover **Food Service**, **Retail & E-commerce**, **Banking & Lending**, and **Healthcare**. There are 32 voice templates, four chat templates, and four flow templates. Logistics, Real Estate, Education, and Travel & Hospitality appear as future industries.

## Demo walkthrough

### Sign in or register

1. Enter the access password.
2. Select **Existing Enterprise** to use the demo account, or **Register Now** to register a directory entry.
3. For the demo account, enter `ops@neofoodresto.com.ph` and select **Send verification code**.
4. Select **Use this code** in the simulated **Demo inbox** to enter the one-time code.
5. For registration, search for an enterprise such as Jollibee, BDO, or Mercury Drug.
6. Enter an email on the selected enterprise's domain, such as `ops@jollibee.com.ph`, and select **Verify**.
7. Wait for the simulated check, then sign in with that email.

The demo account is NeoFoodResto in Food Service. Personal email domains are rejected. Unknown enterprise domains are asked to register first. Registration is stored by domain, so it is not a separate account for each email address.

### Build and edit an agent

After sign-in, **Build** shows the ten templates for the enterprise's industry. Use the channel filters or **See all templates** to browse all 40. To change the industry, open the enterprise menu at the top right, select **Profile**, and expand **Industry looks wrong?**.

For the template path, select a template such as **Post-order feedback call**. Edit **Agent Information**, review **Preview** and **NEO JSON**, then select **Deploy to NEO**.

Setup fields include the service name, persona name, language, goal, opening line, conversation steps, outcomes, and contact variables. The default persona is **Joy**. Outbound voice agents also have a call window. Chat agents show widget/channel choices, and inbound voice agents show the assigned demo hotline.

Use `{persona}` and `{enterprise}` as text placeholders. Saved agents using the older `{merchant}` placeholder remain compatible. Internal storage and directory identifiers retain their existing names.

For the prompt path, select **Want to build something else? Click here**. Describe the agent, select **Generate agent**, review the specification and JSON, then select **Import into NEO**. Generation matches keywords; it does not call an AI model.

In **My Services**, select an agent and choose **Open**, or double-click it. Its tabs include **Overview**, **Test call** / **Try it**, **Call logs** / **Conversations**, **Versions**, and **NEO JSON**. Eligible agents also have **Schedules**. The overview and logs contain sample data.

Select **Edit** to change an existing agent. **Save & republish** creates a new version. **Versions** can restore a previous specification as a new version. Existing published versions and schedules are preserved. The Live/Paused switch changes the simulated service status.

### Upload a CSV and create a schedule

1. Select one eligible agent in **My Services** and choose **Trigger**. Inbound voice agents cannot be triggered this way.
2. Upload a CSV, select **Download Sample**, or choose the sample contact list.
3. Check the required headers and the preview of the first three rows. CSV headers are case-sensitive.
4. Select **Schedule** to open **Schedule Details**.
5. Enter a schedule name, days of the week, and a start/end date-time range. **Select All** and **Weekdays Only** select the days.
6. Select **Start Immediately** to create a running demo schedule, or leave it scheduled.
7. Select **Create**, then open **View schedules**.

The agent's contact variables define its required CSV headers. Voice agents always require `customer_phone`; this variable cannot be removed. Renaming it would break the NEO dialing contract. Adding or removing other variables changes the headers required for future schedules.

Scheduled dates do not automatically start execution in this mockup. Use **Start now (demo)** to advance a scheduled item. Progress advances only while the agent's **Schedules** tab is open. Each schedule stores the current agent version when created, including schedules waiting to start. Running schedules retain that version after an agent is republished. Started schedules cannot be edited.

### Reset the demo

Use the enterprise menu at the top right to **Sign out** or **Reset demo data**. Reset clears demo services and registrations and signs out. The interface-language preference is stored separately.

Demo state is stored in `localStorage` under `gms-state-v1`. Interface language uses `gms-ui-language`. A new enterprise starts with three live sample agents: two outbound voice agents and one chat agent. Changing industry preserves existing agents.

## KYC conversation and audio

Choose **Banking & Lending** in Profile, then open **KYC document reminder** from Build. The template has five steps:

1. Greet and verify.
2. Explain KYC requirement.
3. Confirm document readiness.
4. Guide upload.
5. Close.

The seven-line sample conversation tracks `will_update` and `document_ready`.

The **Preview** and **Test call** screens include fixed English and Tagalog recordings with distinct AI and customer voices. Select the recording's **EN (English)** / **tl (Tagalog)** buttons to choose its audio language independently of the interface language. The green test-call button also plays or stops the selected recording.

The transcript starts empty and reveals words at their recorded speech timestamps. It highlights the current speaker and follows the audio playback position. Pause preserves the revealed text. Stop, replay, and recording-language changes reset it. Seeking reveals only text up to the selected position. Navigation and opening another player stop the previous recording.

The recordings use Joy and a sample bank. Editing an agent does not regenerate the recordings. Both MP3 files are bundled and play offline. Other voice-agent test calls use text simulations without recorded audio.

## Repository layout

| Path | What it is |
|---|---|
| `merchant-studio/` | The app: static HTML/CSS/JS, works offline and from `file://` |
| `merchant-studio/index.html` | Entry gate and initial locale-script loading |
| `merchant-studio/assets/app.js` | Hash-routed application screens, demo state, and simulated behavior |
| `merchant-studio/assets/entry-gate.js` | Password gate that loads the app after verification |
| `merchant-studio/assets/i18n.js` | Language switching and dynamic interface translation |
| `merchant-studio/assets/i18n-tl.js` | Tagalog interface copy and all 40 translated templates |
| `merchant-studio/assets/kyc-player.js` | KYC recording controls and transcript synchronization |
| `merchant-studio/assets/kyc-audio.js` | Fixed KYC recording transcripts and word timestamps |
| `merchant-studio/assets/audio/` | English and Tagalog KYC MP3 recordings |
| `merchant-studio/assets/neo-export.js` | Builds NEO voice / chat / flow import JSON |
| `merchant-studio/assets/data.js` | Industries, templates, demo enterprise detection |
| `merchant-studio/assets/styles.css` | Globe branding, form controls, layout, and responsive styles |
| `merchant-studio/server.js` | Node.js static server with audio byte-range support |
| `merchant-studio/tools/generate-kyc-audio.py` | Development tool that rebuilds KYC recordings and word timings |
| `merchant-studio/tests/` | KYC content, playback, synchronization, and audio-server checks |
| `neo-export-samples/` | Redacted real NEO exports used as the reference for the JSON structure |

The app includes local Globe blue/white logos, NEO branding, and OneByZero full and compact marks. The footer identifies the app as a discussion mockup and shows NEO and OneByZero credits.

## Development checks and audio generation

For KYC content, translation alignment, playback controls, and transcript synchronization:

```sh
node --test merchant-studio/tests/kyc.test.cjs
```

To also check Node.js audio delivery, including byte ranges and seeking responses:

```sh
node --test merchant-studio/tests/kyc.test.cjs merchant-studio/tests/audio-server.test.cjs
```

The complete suite has 16 checks and requires only Node.js. The app has no build step or runtime package dependencies. Native Safari playback and visual rendering still require a browser check.

The bundled recordings were generated with [edge-tts](https://github.com/rany2/edge-tts) and ffmpeg. They use the [Microsoft voices](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support) below:

| Recording | AI voice | Customer voice |
|---|---|---|
| English | `en-PH-RosaNeural` | `en-PH-JamesNeural` |
| Tagalog | `fil-PH-BlessicaNeural` | `fil-PH-AngeloNeural` |

To regenerate them, provide Node.js, Python 3, ffmpeg, and `edge-tts` in a development environment. Then run:

```sh
python3 merchant-studio/tools/generate-kyc-audio.py
```

The generator reads the English and Tagalog KYC scripts from the app. It writes both MP3 files and `merchant-studio/assets/kyc-audio.js`, including word timestamps. Generation needs internet access and sends only the scripted sample text to the speech service. Playback does not use that service.

## Limitations and implementation notes

- **Generated NEO JSON** follows the structure of the samples. Credentials and workspace IDs are placeholders, the Globe telephony config is `<globe-telephony-provider>`, and flow files leave out component code. It has not been tested against a live NEO import.
- **Export formats:** voice uses a stage graph (`voice-agent-export`), chat uses Typebot format (`chatbot-export`), and flow uses Langflow format (`flow-agent-export`). The three redacted samples are the structural reference.
- **Prompt-to-agent** matches keywords; no AI model is called.
- **Samples** in `neo-export-samples/` have keys, auth headers, credential references, internal hosts and workspace IDs replaced with `<redacted>`-style placeholders.
- **Enterprise directory:** the names are real Philippine businesses used for illustration only, with no affiliation implied. The domains are best guesses.
- **Registration:** checks are simulated. Registration accepts a matching subdomain, but sign-in checks exact registered domains. Use the directory's exact domain for the demo.
- **Browser storage:** registrations and agent ownership are demo behavior, not server-enforced account separation. Legacy agents without an owner are visible to signed-in enterprises.
- **Conversation previews:** templates with fixed transcripts use those transcripts. Editing an opening line does not rewrite a fixed transcript or recording.
- **Deployment:** progress messages, Globe phone numbers, and NEO imports are simulated. The repository does not configure AWS, NEO hosting, telephony, or live authentication.
- **Raw exports:** real NEO exports can contain live keys. Keep them out of the app, source control, and shared files. Preserve the redactions in `neo-export-samples/`.
- **Branding:** the Globe name and logo are trademarks of Globe Telecom. Styling follows Globe's site and its Kinetic design system. Globe's typeface (FS Elliot Pro) is licensed and not included.

Use this mockup internally at OneByZero or share it with Globe for the pitch. Get Globe's permission before wider distribution. Fonts use FS Elliot when installed, then the system font stack.

## Design reference

The current tokens are defined in `merchant-studio/assets/styles.css`:

| Globe color | Value |
|---|---|
| Navy | `#1F2E8D` |
| Deep navy | `#0F1646` |
| Action blue | `#0063C5` |
| Sky | `#00A0EA` |
| Light blue | `#EAF5FB` |
| Yellow | `#FFE782` |

Kinetic accents include teal `#10C499`, purple `#7E12E3`, magenta `#EA2283`, yellow `#FCC600`, royal blue `#1340E0`, azure `#1199E5`, and coral `#F06280`. Cards use 16px corners, buttons use 15px corners, fields use 8px corners, and chips use pill shapes. Form labels sit inside their fields. Select controls disable native appearance and use explicit padding, an arrow, and labeled-field height to address the Safari overlap.

## Maintenance and handoff

- Work inside this repository. Clone only when a checkout is missing.
- Small, explicitly requested changes can proceed directly. For exploratory design questions, explain the approach before implementation.
- Label assumptions and unverified behavior. Do not invent NEO or deployment configuration.
- Preserve `customer_phone` exactly in voice stage variables and CSV headers.
- Preserve existing agent versions, schedules, user input, CSV keys, and machine-readable NEO JSON when changing interface copy.
- Rebuild the recording and its word timestamps together when changing the recorded KYC script.

The previous handoff recorded the original Windows working folder as `C:\Users\SeanEscalante\Documents\globe-unified-merchants-platform\`. This historical path is not required to run the project.
