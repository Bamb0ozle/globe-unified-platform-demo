GLOBE AI STUDIO - CLICKABLE MOCKUP
==================================

A concept mockup of an enterprise self-service platform: Globe enterprises sign in
and build AI voice / chat / flow agents, powered by NEO in the background.

Everything is simulated in your browser. No real email, NEO, or telephony
calls are made, and nothing leaves your machine.


HOW TO OPEN
-----------
Option A (simplest): double-click  index.html

Option B (runs on http://localhost:4173):
  Windows:      double-click  start.bat
  macOS/Linux:  double-click  start.command   (or run ./start.command)
  Uses Node.js if installed, otherwise Python. No installs or internet needed.


DEMO SCRIPT (about 5 minutes)
-----------------------------
Enter the access password supplied by the demo owner before opening the app.
The password is required again after a reload, including saved enterprise sessions.
This browser-only gate does not protect source files on static hosting.
Use server-side authentication when enforced access protection is needed.

Use EN (English) or tl (Tagalog) to change the interface language.
The switch is on the entry gate, sign-in screens, and app header.
The language choice is saved for the next visit. Switching preserves form entries.
All 40 templates, default form content, and sample conversations have Tagalog copy.
CSV headers, user content, and NEO JSON keep their original values.
The agent setup section is named "Agent Information".

KYC DEMO AUDIO
The KYC document reminder checks document readiness before upload guidance.
Choose Banking & Lending in Profile, then open the KYC template from Build.
The Preview and Test call screens include fixed English and Tagalog recordings.
Use the recording's EN (English) / tl (Tagalog) buttons to choose its language.
The transcript highlights the speaker during playback.
The green test-call button also plays or stops the selected recording.
These fixed samples use Joy and a sample bank. Agent edits do not change them.
Both recordings are included with the app and play offline.
The launchers use Node.js first, then the included Python fallback server.
Both servers support Safari audio loading and seeking.

1. Start screen: choose "Existing Enterprise" or "Register Now".
   - Existing Enterprise: sign in with  ops@neofoodresto.com.ph  (pre-registered
     demo account). The one-time code appears in the "Demo inbox" pop-up;
     click "Use this code".
   - Register Now: search for the business (e.g. "Jollibee", "BDO",
     "Mercury Drug"; 100 sample enterprises, 25 per industry), enter a work
     email on that enterprise's domain (e.g. ops@jollibee.com.ph), click Verify,
     wait for the simulated check, then sign in with that email.
   - Unregistered emails are told to register first; personal domains are rejected.
2. After sign-in you land straight on your industry's top 10 Agents (the
   industry comes from the enterprise directory). "See all templates" shows all
   40 across industries. To change the industry, open Profile (enterprise menu,
   top right) > "Industry looks wrong?".
3. Build page:
   a. Template path: click "Post-order feedback call", tweak it, look at the
      Preview and NEO JSON tabs, then "Deploy to NEO".
   b. Prompt path: at the bottom, click "Want to build something else? Click here",
      describe the agent, "Generate agent", review the generated NEO JSON,
      then "Import into NEO".
4. My Services: the enterprise starts with three live agents. Select one, click
   "Trigger", upload a CSV (or use the sample list), then "Schedule" to fill in
   the NEO-style Schedule Details (name, days of week, period, Start Immediately).
   The required CSV headers are the agent's variables, as in NEO.
   Double-click an agent (or click Open) to place a test call, see call logs,
   and follow its Schedules.
   Click "Edit" on an agent to change its script, steps, outcomes or CSV
   variables. "Save & republish" publishes a new version; the Versions tab
   lists every version and can restore an older one. Schedules that already
   started keep the version they began with.
5. Each enterprise only sees its own agents. Use the enterprise menu (top right) >
   "Reset demo data" to clear agents and registrations and start over.


BRANDING
--------
Uses the official Globe logo (from globe.com.ph) and Globe's brand colours,
with styling based on Globe's Kinetic design system. The Globe name and logo
are Globe Telecom trademarks: keep this mockup internal to OneByZero, or share
it with Globe as part of a pitch. Do not share it more widely without Globe's OK.
Globe's typeface (FS Elliot Pro) is licensed and not included; the page uses it
if installed, otherwise the system font.


ENTERPRISE DIRECTORY
--------------------
The 100 enterprise names are real Philippine businesses, used for illustration
only (no affiliation implied). Their email domains are best guesses, and the
domain "verification" is simulated.


ABOUT THE GENERATED NEO JSON
----------------------------
The import files follow the structure of real NEO exports
(voice-agent-export, chatbot-export, flow-agent-export). Credentials, hosts and
the workspace ID are blank placeholders; Globe telephony settings are
"<globe-telephony-provider>" until that integration is defined. Flow files are
abridged (component code omitted). They have not been tested against a live NEO
import.

Prompt-to-agent generation is keyword-based (no AI model is called), so the
demo works offline and gives the same result every time.
