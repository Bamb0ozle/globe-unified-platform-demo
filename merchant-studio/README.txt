GLOBE AI STUDIO - CLICKABLE MOCKUP
==================================

A concept mockup of a merchant self-service platform: Globe merchants sign in
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
1. Start screen: choose "Existing Merchant" or "Register Now".
   - Existing Merchant: sign in with  ops@neofoodresto.com.ph  (pre-registered
     demo account). The one-time code appears in the "Demo inbox" pop-up;
     click "Use this code".
   - Register Now: search for the business (e.g. "Jollibee", "BDO",
     "Mercury Drug"; 100 sample merchants, 25 per industry), enter a work
     email on that merchant's domain (e.g. ops@jollibee.com.ph), click Verify,
     wait for the simulated check, then sign in with that email.
   - Unregistered emails are told to register first; personal domains are rejected.
2. Confirm the business profile (name and industry come from the directory).
3. Build page: the merchant's industry templates come first.
   a. Template path: click "Post-order feedback call", tweak it, look at the
      Preview and NEO JSON tabs, then "Deploy to NEO".
   b. Prompt path: at the bottom, click "Want to build something else? Click here",
      describe the agent, "Generate agent", review the generated NEO JSON,
      then "Import into NEO".
4. My Services: the merchant starts with three live agents. Select one, click
   "Trigger", upload a CSV (or use the sample list), then "Schedule" to fill in
   the NEO-style Schedule Details (name, days of week, period, Start Immediately).
   The required CSV headers are the agent's variables, as in NEO.
   Open an agent to place a test call, see call logs, and follow its Schedules.
5. Each merchant only sees its own agents. Use the merchant menu (top right) >
   "Reset demo data" to clear agents and registrations and start over.


BRANDING
--------
Uses the official Globe logo (from globe.com.ph) and Globe's brand colours,
with styling based on Globe's Kinetic design system. The Globe name and logo
are Globe Telecom trademarks: keep this mockup internal to OneByZero, or share
it with Globe as part of a pitch. Do not share it more widely without Globe's OK.
Globe's typeface (FS Elliot Pro) is licensed and not included; the page uses it
if installed, otherwise the system font.


MERCHANT DIRECTORY
------------------
The 100 merchant names are real Philippine businesses, used for illustration
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
