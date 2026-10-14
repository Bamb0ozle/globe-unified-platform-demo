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
1. Sign in with  ops@neofoodresto.com.ph
   - The verification code appears in the "Demo inbox" pop-up. Click "Use this code".
   - Personal emails (gmail.com etc.) are rejected; other business domains work
     and you pick the industry yourself.
2. Confirm the business profile (NeoFoodResto, Food Service).
3. "What do you want to build today?"
   a. Template path: click "Post-order feedback call", tweak it, look at the
      Preview and NEO JSON tabs, then "Deploy to NEO".
   b. Prompt path: click an example prompt (or type your own), "Generate agent",
      review what was understood and the generated NEO JSON, then "Import into NEO".
4. After deploying: place a test call, view call logs, and (outbound voice)
   upload a customer list and launch a campaign.
5. Use the merchant menu (top right) > "Reset demo data" to start over.


BRANDING
--------
Uses the official Globe logo (from globe.com.ph) and Globe's brand colours,
with styling based on Globe's Kinetic design system. The Globe name and logo
are Globe Telecom trademarks: keep this mockup internal to OneByZero, or share
it with Globe as part of a pitch. Do not share it more widely without Globe's OK.
Globe's typeface (FS Elliot Pro) is licensed and not included; the page uses it
if installed, otherwise the system font.


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
