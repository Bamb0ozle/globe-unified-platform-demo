/* Mock content: industries, templates, enterprise detection.
{enterprise} and {persona} are replaced at render time. */

window.GMS_DATA = (function () {
  const industries = [
    { id: "food", name: "Food Service", icon: "🍕", live: true },
    { id: "retail", name: "Retail & E-commerce", icon: "🛍️", live: true },
    { id: "banking", name: "Banking & Lending", icon: "🏦", live: true },
    { id: "healthcare", name: "Healthcare", icon: "🩺", live: true },
    { id: "logistics", name: "Logistics", icon: "🚚", live: false },
    { id: "realestate", name: "Real Estate", icon: "🏠", live: false },
    { id: "education", name: "Education", icon: "🎓", live: false },
    { id: "travel", name: "Travel & Hospitality", icon: "✈️", live: false },
  ];

  // m(name, type, desc) -> outcome field tracked per conversation
  const m = (name, type, desc) => ({ name, type, desc });

  const templates = {
    food: [
      {
        id: "food-feedback", channel: "voice", direction: "outbound", popular: true,
        name: "Post-order feedback call",
        blurb: "Call customers after delivery to rate their order and capture comments.",
        greeting: "Hi! This is {persona} from {enterprise}. Is this a good time for a quick 1-minute feedback call about your order today?",
        pitch: "Thank you! On a scale of 1 to 5, how would you rate your order today?",
        reply: "I'd say 4. The pizza was great but it arrived a bit late.",
        stages: ["Greet and confirm availability", "Ask overall rating (1-5)", "Ask what could be better", "Offer voucher if rating ≤ 3", "Thank and close"],
        metrics: [m("rating", "number", "Overall rating the customer gave, 1 to 5."), m("late_delivery_mentioned", "boolean", "Did the customer mention late delivery? True or False."), m("voucher_offered", "boolean", "Was a make-good voucher offered? True or False.")],
        transcript: [
          ["agent", "Hi! This is {persona} from {enterprise}. Is this a good time for a quick 1-minute feedback call about your order today?"],
          ["customer", "Sure, go ahead."],
          ["agent", "Thank you! On a scale of 1 to 5, how would you rate your order today?"],
          ["customer", "I'd say 4. The pizza was great but it arrived a bit late."],
          ["agent", "Glad you enjoyed it, and sorry about the wait. Roughly how late was it?"],
          ["customer", "Maybe 15 minutes past the estimate."],
          ["agent", "Thanks, I've noted that for our delivery team. Anything else we could do better?"],
          ["customer", "No, that's it. Thanks!"],
          ["agent", "Salamat po! Enjoy the rest of your day. Goodbye!"],
        ],
        summary: { rating: "4", late_delivery_mentioned: "True", voucher_offered: "False" },
      },
      {
        id: "food-delay", channel: "voice", direction: "outbound",
        name: "Delivery delay alert",
        blurb: "Proactively call when an order is running late, share a new ETA and offer options.",
        greeting: "Hi, this is {persona} from {enterprise} calling about your order.",
        pitch: "Your order is running about 20 minutes late. Would you like to keep it, or cancel for a full refund?",
        reply: "I'll keep it, thanks for letting me know.",
        stages: ["Greet and verify customer", "Explain delay and new ETA", "Offer keep / cancel / voucher", "Confirm choice", "Close"],
        metrics: [m("order_kept", "boolean", "Did the customer keep the order? True or False."), m("cancel_requested", "boolean", "Did the customer ask to cancel? True or False.")],
      },
      {
        id: "food-confirm", channel: "voice", direction: "outbound",
        name: "Order confirmation call",
        blurb: "Confirm large or cash-on-delivery orders before the kitchen starts preparing.",
        greeting: "Hi, this is {persona} from {enterprise}. I'm calling to confirm the order you just placed.",
        pitch: "I have 2 large pizzas and a 1.5L soda for delivery to Makati, cash on delivery. Is that correct?",
        reply: "Yes, that's right.",
        stages: ["Greet", "Read back order items", "Confirm address and payment", "Give ETA", "Close"],
        metrics: [m("order_confirmed", "boolean", "Did the customer confirm the order? True or False."), m("changes_requested", "boolean", "Did the customer change anything? True or False.")],
      },
      {
        id: "food-ordering", channel: "voice", direction: "inbound", popular: true,
        name: "Phone ordering hotline",
        blurb: "Answer the delivery hotline 24/7, take orders, upsell, and send them to the store.",
        greeting: "Thank you for calling {enterprise}! This is {persona}. What can I get for you today?",
        pitch: "Great choice. Would you like to add garlic bread for just ₱99?",
        reply: "Sure, add one garlic bread.",
        stages: ["Greet caller", "Take order items", "Suggest add-on", "Capture address and payment", "Read back and confirm", "Close with ETA"],
        metrics: [m("order_placed", "boolean", "Was an order placed? True or False."), m("upsell_accepted", "boolean", "Did the caller accept an add-on? True or False.")],
      },
      {
        id: "food-reservation", channel: "voice", direction: "inbound",
        name: "Reservation booking & reminders",
        blurb: "Book tables by phone and call guests the day before to confirm.",
        greeting: "Hi, thank you for calling {enterprise}. This is {persona}. Are you looking to book a table?",
        pitch: "I can do Saturday at 7 PM for 4 guests. Shall I book that under your name?",
        reply: "Yes please, under Santos.",
        stages: ["Greet", "Ask date, time, party size", "Check availability", "Confirm booking", "Close"],
        metrics: [m("booking_made", "boolean", "Was a reservation booked? True or False."), m("party_size", "number", "Number of guests.")],
      },
      {
        id: "food-winback", channel: "voice", direction: "outbound",
        name: "Win back lapsed customers",
        blurb: "Re-engage customers who haven't ordered in 60+ days with a personalised offer.",
        greeting: "Hi! This is {persona} from {enterprise}. We've missed you!",
        pitch: "As a welcome back, here's 20% off your next order this week. Can I text you the code?",
        reply: "Oh nice, yes please send it.",
        stages: ["Greet", "Present welcome-back offer", "Handle objections", "Send promo code via SMS", "Close"],
        metrics: [m("offer_accepted", "boolean", "Did the customer accept the offer? True or False."), m("reason_for_lapse", "string", "Why the customer stopped ordering, if mentioned.")],
      },
      {
        id: "food-promo", channel: "voice", direction: "outbound",
        name: "New menu & promo announcement",
        blurb: "Tell loyal customers about new items and limited-time deals.",
        greeting: "Hi, this is {persona} from {enterprise} with some exciting news!",
        pitch: "Our new Cheesy Bites pizza launches this Friday, and loyalty members get it at 15% off. Interested?",
        reply: "Sounds good, I might order this weekend.",
        stages: ["Greet", "Announce new item / promo", "Gauge interest", "Offer to place order now", "Close"],
        metrics: [m("interested", "boolean", "Did the customer show interest? True or False."), m("opted_out", "boolean", "Did the customer ask not to be called again? True or False.")],
      },
      {
        id: "food-complaint", channel: "voice", direction: "outbound",
        name: "Complaint callback",
        blurb: "Call back customers who filed a complaint, apologise and resolve or escalate.",
        greeting: "Hi, this is {persona} from {enterprise}. I'm calling about the concern you raised yesterday.",
        pitch: "I'm really sorry about the missing item. We'd like to send a replacement or refund it. Which do you prefer?",
        reply: "A refund to my GCash would be fine.",
        stages: ["Greet and reference ticket", "Apologise and confirm issue", "Offer resolution options", "Escalate to human if needed", "Close"],
        metrics: [m("resolved", "boolean", "Was the complaint resolved on the call? True or False."), m("escalated", "boolean", "Was it escalated to a human? True or False.")],
      },
      {
        id: "food-faq", channel: "chat", direction: null,
        name: "Store hours & FAQ assistant",
        blurb: "Website and Messenger chat for store hours, menu, allergens and delivery areas.",
        greeting: "Hi! I'm {persona}, {enterprise}'s assistant. How can I help?",
        pitch: "Our Makati branch is open 10 AM to 11 PM daily. Anything else?",
        reply: "Do you deliver to BGC?",
        stages: ["Store hours", "Menu & prices", "Allergens", "Delivery areas", "Talk to a person"],
        metrics: [m("question_answered", "boolean", "Was the question answered? True or False.")],
      },
      {
        id: "food-catering", channel: "flow", direction: null,
        name: "Catering & bulk order assistant",
        blurb: "Agentic flow that builds catering quotes from the menu and books a callback from sales.",
        greeting: "Hi! I'm {persona}. Planning an event? I can put together a catering quote.",
        pitch: "For 50 guests I suggest 12 family pizzas, 4 pasta trays and drinks: about ₱18,500. Want me to send the quote?",
        reply: "Yes, email it to me please.",
        stages: ["Capture event details", "Look up menu & pricing (tool)", "Build quote", "Email quote (tool)", "Book sales callback"],
        metrics: [m("quote_sent", "boolean", "Was a quote sent? True or False.")],
        tools: ["Menu & pricing lookup (MCP)", "Email sender (MCP)", "Current date"],
      },
    ],

    retail: [
      {
        id: "retail-cart", channel: "voice", direction: "outbound", popular: true,
        name: "Abandoned cart recovery call",
        blurb: "Call shoppers who left items in their cart and help them complete checkout.",
        greeting: "Hi, this is {persona} from {enterprise}. I noticed you left a few items in your cart.",
        pitch: "The sneakers you picked are almost sold out in your size. Want me to hold them and send a checkout link?",
        reply: "Yes, send me the link.",
        stages: ["Greet", "Remind of cart items", "Handle hesitation (price, shipping)", "Send checkout link via SMS", "Close"],
        metrics: [m("link_sent", "boolean", "Was a checkout link sent? True or False."), m("hesitation_reason", "string", "Why the shopper didn't check out.")],
      },
      {
        id: "retail-status", channel: "voice", direction: "inbound",
        name: "Order & delivery status hotline",
        blurb: "Callers say their order number and get live tracking status instantly.",
        greeting: "Thanks for calling {enterprise}. This is {persona}. Can I have your order number?",
        pitch: "Order 48213 is out for delivery and should arrive by 3 PM today.",
        reply: "Great, thank you.",
        stages: ["Greet", "Capture order number", "Look up status", "Share ETA", "Close"],
        metrics: [m("status_given", "boolean", "Was a status given? True or False.")],
      },
      {
        id: "retail-csat", channel: "voice", direction: "outbound",
        name: "Post-purchase satisfaction survey",
        blurb: "Short survey call a few days after delivery to measure CSAT and NPS.",
        greeting: "Hi, this is {persona} from {enterprise}. Do you have a minute to rate your recent purchase?",
        pitch: "How likely are you to recommend {enterprise} to a friend, from 0 to 10?",
        reply: "Probably a 9.",
        stages: ["Greet", "Ask NPS (0-10)", "Ask reason", "Thank and close"],
        metrics: [m("nps", "number", "NPS score 0 to 10."), m("reason", "string", "Main reason for the score.")],
      },
      {
        id: "retail-returns", channel: "voice", direction: "inbound",
        name: "Return & exchange assistant",
        blurb: "Guide callers through return eligibility and schedule a pickup.",
        greeting: "Hi, this is {persona} from {enterprise}. Are you calling about a return or exchange?",
        pitch: "Your item is within the 30-day window. I can schedule a free pickup tomorrow. Does that work?",
        reply: "Tomorrow works.",
        stages: ["Greet", "Identify order and item", "Check return policy", "Schedule pickup", "Close"],
        metrics: [m("return_scheduled", "boolean", "Was a pickup scheduled? True or False.")],
      },
      {
        id: "retail-loyalty", channel: "voice", direction: "outbound",
        name: "Loyalty points & rewards reminder",
        blurb: "Remind members of expiring points and nudge them to redeem.",
        greeting: "Hi, this is {persona} from {enterprise} Rewards.",
        pitch: "You have 1,200 points expiring at month end, worth ₱600 off. Want me to text you how to redeem?",
        reply: "Yes please.",
        stages: ["Greet", "Share points balance and expiry", "Suggest redemption", "Close"],
        metrics: [m("redeem_intent", "boolean", "Did the member plan to redeem? True or False.")],
      },
      {
        id: "retail-restock", channel: "voice", direction: "outbound",
        name: "Back-in-stock notification",
        blurb: "Call waitlisted customers the moment an item is back in stock.",
        greeting: "Hi, {persona} here from {enterprise}. Good news!",
        pitch: "The item you were waiting for is back in stock. Should I reserve one for you?",
        reply: "Yes, reserve it!",
        stages: ["Greet", "Announce restock", "Offer reservation", "Close"],
        metrics: [m("reserved", "boolean", "Did the customer reserve the item? True or False.")],
      },
      {
        id: "retail-cod", channel: "voice", direction: "outbound", popular: true,
        name: "COD order confirmation",
        blurb: "Confirm cash-on-delivery orders to cut failed deliveries and returns.",
        greeting: "Hi, this is {persona} from {enterprise} confirming your cash-on-delivery order.",
        pitch: "Your total is ₱2,450 for delivery tomorrow. Will someone be home to receive and pay?",
        reply: "Yes, I'll be home.",
        stages: ["Greet", "Read back order and total", "Confirm address and availability", "Close"],
        metrics: [m("cod_confirmed", "boolean", "Was the COD order confirmed? True or False."), m("cancelled", "boolean", "Did the customer cancel? True or False.")],
      },
      {
        id: "retail-appointment", channel: "voice", direction: "inbound",
        name: "Personal shopper booking",
        blurb: "Book in-store styling or personal shopper appointments by phone.",
        greeting: "Hi, this is {persona} from {enterprise}. Would you like to book a personal shopping session?",
        pitch: "I have Thursday at 2 PM at our Glorietta store. Shall I book it?",
        reply: "Perfect.",
        stages: ["Greet", "Ask preferred branch and time", "Confirm slot", "Close"],
        metrics: [m("booked", "boolean", "Was an appointment booked? True or False.")],
      },
      {
        id: "retail-faq", channel: "chat", direction: null,
        name: "Product FAQ & size guide",
        blurb: "Chat assistant for sizing, materials, shipping fees and store locations.",
        greeting: "Hi! I'm {persona} from {enterprise}. Need help with sizing or shipping?",
        pitch: "For that shoe, most customers go half a size up. Want the size chart?",
        reply: "Yes please.",
        stages: ["Size guide", "Shipping & fees", "Store locator", "Talk to a person"],
        metrics: [m("question_answered", "boolean", "Was the question answered? True or False.")],
      },
      {
        id: "retail-recommender", channel: "flow", direction: null,
        name: "Product recommender",
        blurb: "Agentic flow that asks a few questions and recommends products from the catalogue.",
        greeting: "Hi! I'm {persona}. Tell me what you're shopping for and I'll find the best match.",
        pitch: "Based on your budget and style, here are 3 picks. Want me to add one to your cart?",
        reply: "Add the second one.",
        stages: ["Understand need and budget", "Search catalogue (tool)", "Recommend top 3", "Add to cart (tool)"],
        metrics: [m("added_to_cart", "boolean", "Was an item added to cart? True or False.")],
        tools: ["Catalogue search (MCP)", "Cart API (MCP)"],
      },
    ],

    banking: [
      {
        id: "bank-reminder", channel: "voice", direction: "outbound", popular: true,
        name: "Loan payment reminder",
        blurb: "Friendly reminder calls a few days before a loan or card payment is due.",
        greeting: "Hi, this is {persona} from {enterprise}. This is a courtesy reminder about your upcoming payment.",
        pitch: "Your payment of ₱5,200 is due on the 25th. Would you like the payment options sent by SMS?",
        reply: "Yes, send them.",
        stages: ["Greet and verify identity (name + birth date)", "State amount and due date", "Offer payment channels", "Capture promise-to-pay date", "Close"],
        metrics: [m("promise_to_pay", "boolean", "Did the customer commit to pay? True or False."), m("ptp_date", "string", "Date the customer committed to pay.")],
      },
      {
        id: "bank-collections", channel: "voice", direction: "outbound",
        name: "Past-due follow-up",
        blurb: "Early-stage collections calls with compliant scripts and promise-to-pay capture.",
        greeting: "Hi, this is {persona} from {enterprise}. May I speak with the account holder?",
        pitch: "Your account is 7 days past due. Can you settle this week, or would a payment plan help?",
        reply: "I can pay on Friday.",
        stages: ["Greet and verify", "Disclose past-due amount", "Explore pay date or plan", "Confirm promise-to-pay", "Close"],
        metrics: [m("promise_to_pay", "boolean", "Did the customer commit to pay? True or False."), m("hardship_flag", "boolean", "Did the customer mention financial hardship? True or False.")],
      },
      {
        id: "bank-appstatus", channel: "voice", direction: "inbound",
        name: "Loan application status",
        blurb: "Applicants call to check status and outstanding requirements.",
        greeting: "Thank you for calling {enterprise}. This is {persona}. Can I have your application reference number?",
        pitch: "Your application is under review. We still need your latest payslip. You can upload it in the app.",
        reply: "Okay, I'll upload it today.",
        stages: ["Greet", "Capture reference number", "Share status", "List missing requirements", "Close"],
        metrics: [m("missing_docs", "boolean", "Were there missing documents? True or False.")],
      },
      {
        id: "bank-activation", channel: "voice", direction: "outbound",
        name: "Card activation & onboarding",
        blurb: "Welcome new cardholders and walk them through activation in the app.",
        greeting: "Hi, this is {persona} from {enterprise}. Welcome! Have you received your new card?",
        pitch: "Great! You can activate it in the app under Cards, then Activate. Want me to stay on while you do it?",
        reply: "Sure, give me a second.",
        stages: ["Greet", "Confirm card received", "Guide activation", "Explain key features", "Close"],
        metrics: [m("activated", "boolean", "Was the card activated on the call? True or False.")],
      },
      {
        id: "bank-fraud", channel: "voice", direction: "outbound",
        name: "Suspicious transaction check",
        blurb: "Call cardholders to confirm or deny flagged transactions in real time.",
        greeting: "Hi, this is {persona} from {enterprise}'s security team.",
        pitch: "We noticed a ₱12,000 online purchase a few minutes ago. Did you make this transaction?",
        reply: "No, that wasn't me!",
        stages: ["Greet and verify", "Read flagged transaction", "Confirm or deny", "Block card and transfer to human if denied", "Close"],
        metrics: [m("transaction_denied", "boolean", "Did the customer deny the transaction? True or False."), m("transferred_to_human", "boolean", "Was the call transferred? True or False.")],
      },
      {
        id: "bank-faq", channel: "voice", direction: "inbound", popular: true,
        name: "Banking FAQ hotline (Taglish)",
        blurb: "Bilingual Taglish/English hotline answering FAQs from your knowledge base, with human handoff.",
        greeting: "Hi, I am {persona}, {enterprise}'s AI assistant. How can I help you today?",
        pitch: "Para mag-reset ng password, i-tap ang 'Forgot Password' sa login screen, then follow the steps.",
        reply: "Ah okay, salamat!",
        stages: ["Greet and route", "General inquiry (knowledge base)", "Password reset guide", "First-time registration guide", "Transfer to human", "Farewell"],
        metrics: [m("call_language", "string", "Language of the call: taglish or english."), m("faq_answered", "boolean", "Was at least one question answered from the KB? True or False."), m("human_agent_requested", "boolean", "Did the caller ask for a human? True or False.")],
        transcript: [
          ["agent", "Hi, I am {persona}, {enterprise}'s AI assistant. How can I help you today?"],
          ["customer", "Hello, nakalimutan ko yung password ko sa app."],
          ["agent", "Walang problema! Para mag-reset, i-tap ang 'Forgot Password' sa login screen ng app."],
          ["customer", "Okay, tapos?"],
          ["agent", "Ilagay ang registered mobile number mo, then hintayin ang OTP. Pagkatapos, gumawa ng bagong password."],
          ["customer", "Got it. Salamat!"],
          ["agent", "Walang anuman! May iba pa ba akong maitutulong?"],
          ["customer", "Wala na, bye."],
          ["agent", "Salamat sa pagtawag sa {enterprise}. Paalam!"],
        ],
        summary: { call_language: "taglish", faq_answered: "True", human_agent_requested: "False" },
      },
      {
        id: "bank-kyc", channel: "voice", direction: "outbound",
        name: "KYC document reminder",
        blurb: "Remind customers to update IDs and KYC documents before they lapse.",
        greeting: "Hi, this is {persona} from {enterprise}.",
        pitch: "Your valid ID on file expires next month. You can upload a new one in the app in under 2 minutes.",
        reply: "Okay, I'll do it tonight.",
        stages: ["Greet and verify", "Explain KYC requirement", "Guide upload", "Close"],
        metrics: [m("will_update", "boolean", "Did the customer agree to update? True or False.")],
      },
      {
        id: "bank-crosssell", channel: "voice", direction: "outbound",
        name: "Pre-approved credit card offer",
        blurb: "Offer pre-approved cards or loans to eligible customers and capture interest.",
        greeting: "Hi, this is {persona} from {enterprise}. You're pre-approved for one of our cards!",
        pitch: "It has no annual fee for the first year and 5% cashback on groceries. Want me to start your application?",
        reply: "Tell me more about the cashback.",
        stages: ["Greet", "Present offer", "Answer questions", "Capture interest / consent", "Close"],
        metrics: [m("interested", "boolean", "Did the customer show interest? True or False.")],
      },
      {
        id: "bank-chat", channel: "chat", direction: null,
        name: "Account services chat",
        blurb: "In-app chat for balances, card controls, branch info and FAQs.",
        greeting: "Hi! I'm {persona}, your {enterprise} assistant. What do you need help with?",
        pitch: "You can lock your card instantly under Cards, then Lock. Want me to show you how?",
        reply: "Yes please.",
        stages: ["Card controls", "Fees & charges", "Branch & ATM finder", "Talk to a person"],
        metrics: [m("question_answered", "boolean", "Was the question answered? True or False.")],
      },
      {
        id: "bank-prequal", channel: "flow", direction: null,
        name: "Loan eligibility pre-qualifier",
        blurb: "Agentic flow that asks income questions, checks rules and hands hot leads to a voice agent.",
        greeting: "Hi! I'm {persona}. Let's see which loan you could qualify for. It takes 2 minutes.",
        pitch: "Based on your income you may qualify for up to ₱250,000. Want a loan officer to call you?",
        reply: "Yes, call me tomorrow morning.",
        stages: ["Collect income & employment", "Apply eligibility rules (tool)", "Show indicative offer", "Trigger callback voice agent (tool)"],
        metrics: [m("qualified", "boolean", "Did the applicant pre-qualify? True or False.")],
        tools: ["Eligibility rules (MCP)", "Voice agent call", "Current date"],
      },
    ],

    healthcare: [
      {
        id: "hc-reminder", channel: "voice", direction: "outbound", popular: true,
        name: "Appointment reminder & confirmation",
        blurb: "Call patients a day ahead to confirm, reschedule, or cancel appointments.",
        greeting: "Hi, this is {persona} from {enterprise}, calling about your appointment tomorrow.",
        pitch: "You're booked with Dr. Reyes at 10 AM. Can you confirm you'll be there?",
        reply: "Yes, I'll be there.",
        stages: ["Greet and verify patient", "Read appointment details", "Confirm / reschedule / cancel", "Share prep instructions", "Close"],
        metrics: [m("confirmed", "boolean", "Did the patient confirm? True or False."), m("rescheduled", "boolean", "Did the patient reschedule? True or False.")],
      },
      {
        id: "hc-booking", channel: "voice", direction: "inbound",
        name: "Appointment booking hotline",
        blurb: "Patients call to book consultations by doctor, specialty, or schedule.",
        greeting: "Thank you for calling {enterprise}. This is {persona}. Which doctor or specialty would you like to see?",
        pitch: "Dr. Cruz in Pediatrics has an opening Monday at 3 PM. Shall I book it?",
        reply: "Yes please.",
        stages: ["Greet", "Ask specialty / doctor", "Offer available slots", "Capture patient details", "Confirm and close"],
        metrics: [m("booked", "boolean", "Was an appointment booked? True or False.")],
      },
      {
        id: "hc-labs", channel: "voice", direction: "outbound",
        name: "Lab results ready notification",
        blurb: "Tell patients their results are ready and how to get them. No results are read on the call.",
        greeting: "Hi, this is {persona} from {enterprise}.",
        pitch: "Your lab results are ready. You can view them in the patient portal or pick them up at the front desk.",
        reply: "Okay, I'll check the portal.",
        stages: ["Greet and verify", "Notify results ready", "Explain how to access", "Offer follow-up booking", "Close"],
        metrics: [m("followup_booked", "boolean", "Was a follow-up booked? True or False.")],
      },
      {
        id: "hc-refill", channel: "voice", direction: "outbound",
        name: "Medication refill reminder",
        blurb: "Remind patients when maintenance meds are due for refill.",
        greeting: "Hi, this is {persona} from {enterprise} Pharmacy.",
        pitch: "Your maintenance prescription is due for refill this week. Want us to prepare it for pickup?",
        reply: "Yes, I'll pick it up Saturday.",
        stages: ["Greet and verify", "Remind refill due", "Offer pickup or delivery", "Close"],
        metrics: [m("refill_requested", "boolean", "Did the patient request a refill? True or False.")],
      },
      {
        id: "hc-followup", channel: "voice", direction: "outbound",
        name: "Post-visit follow-up",
        blurb: "Check in after a visit and collect satisfaction feedback.",
        greeting: "Hi, this is {persona} from {enterprise}, following up on your visit last week.",
        pitch: "How was your experience with us, from 1 to 5?",
        reply: "5, the staff were really kind.",
        stages: ["Greet", "Ask how patient is feeling", "Ask satisfaction (1-5)", "Escalate concerns to nurse", "Close"],
        metrics: [m("rating", "number", "Satisfaction rating 1 to 5."), m("escalated", "boolean", "Was a concern escalated? True or False.")],
      },
      {
        id: "hc-noshow", channel: "voice", direction: "outbound",
        name: "No-show rebooking",
        blurb: "Reach patients who missed appointments and rebook them.",
        greeting: "Hi, this is {persona} from {enterprise}. We missed you at your appointment today.",
        pitch: "Would you like to rebook? I have openings later this week.",
        reply: "Yes, Thursday please.",
        stages: ["Greet", "Acknowledge missed visit", "Offer new slots", "Confirm and close"],
        metrics: [m("rebooked", "boolean", "Was the patient rebooked? True or False.")],
      },
      {
        id: "hc-hmo", channel: "voice", direction: "inbound",
        name: "HMO & coverage inquiry",
        blurb: "Answer which HMOs are accepted and what's covered, then transfer if needed.",
        greeting: "Hi, this is {persona} from {enterprise}. Are you calling about HMO coverage?",
        pitch: "Yes, we accept that HMO for consultations and basic labs. Bring your card and a valid ID.",
        reply: "Great, thanks.",
        stages: ["Greet", "Identify HMO", "Explain accepted services", "Transfer to billing if needed", "Close"],
        metrics: [m("hmo_accepted", "boolean", "Was the caller's HMO accepted? True or False.")],
      },
      {
        id: "hc-vaccine", channel: "voice", direction: "outbound",
        name: "Vaccination schedule reminder",
        blurb: "Remind parents of upcoming pediatric vaccine schedules.",
        greeting: "Hi, this is {persona} from {enterprise} Pediatrics.",
        pitch: "Your child's next vaccine is due this month. Would you like to book a slot?",
        reply: "Yes, next Tuesday.",
        stages: ["Greet", "Share vaccine due", "Book slot", "Close"],
        metrics: [m("booked", "boolean", "Was a slot booked? True or False.")],
      },
      {
        id: "hc-faq", channel: "chat", direction: null,
        name: "Clinic FAQ & directions",
        blurb: "Chat for clinic hours, doctor schedules, parking and directions.",
        greeting: "Hi! I'm {persona} from {enterprise}. How can I help?",
        pitch: "Our clinic is open Monday to Saturday, 8 AM to 6 PM. Parking is at Basement 1.",
        reply: "Is Dr. Reyes in on Saturdays?",
        stages: ["Clinic hours", "Doctor schedules", "Directions & parking", "Talk to a person"],
        metrics: [m("question_answered", "boolean", "Was the question answered? True or False.")],
      },
      {
        id: "hc-routing", channel: "flow", direction: null,
        name: "Specialty routing assistant",
        blurb: "Agentic flow that asks non-diagnostic questions and routes patients to the right specialty.",
        greeting: "Hi! I'm {persona}. I can help you find the right doctor. I can't give medical advice.",
        pitch: "Based on what you shared, a Dermatology consult fits best. Want me to book one?",
        reply: "Yes please.",
        stages: ["Collect reason for visit", "Map to specialty (tool)", "Show available doctors (tool)", "Book appointment"],
        metrics: [m("routed", "boolean", "Was the patient routed to a specialty? True or False.")],
        tools: ["Doctor directory (MCP)", "Scheduling API (MCP)"],
      },
    ],
  };

  const freeDomains = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "icloud.com", "ymail.com", "proton.me", "protonmail.com"];

  // Demo account that is already registered (sign-in works without registering).
  const knownMerchants = {
    "neofoodresto.com.ph": { name: "NeoFoodResto", industry: "food" },
  };

  // Enterprise directory used by "Register Now": 25 Philippine businesses per industry.
  // Names are real brands for illustration only; domains are best guesses for the demo
  // and the email "domain check" is simulated.
  const directory = {
    food: [
      ["Jollibee", "jollibee.com.ph"], ["Chowking", "chowking.com.ph"], ["Greenwich", "greenwich.com.ph"],
      ["Red Ribbon", "redribbonbakeshop.com.ph"], ["Mang Inasal", "manginasal.com"], ["McDonald's Philippines", "mcdonalds.com.ph"],
      ["KFC Philippines", "kfc.com.ph"], ["Shakey's Pizza", "shakeyspizza.ph"], ["Max's Restaurant", "maxschicken.com"],
      ["Goldilocks", "goldilocks.com.ph"], ["Army Navy Burger + Burrito", "armynavy.com.ph"], ["Yellow Cab Pizza", "yellowcabpizza.com"],
      ["Bonchon Philippines", "bonchon.com.ph"], ["Starbucks Philippines", "starbucks.ph"], ["Tim Hortons Philippines", "timhortons.ph"],
      ["Krispy Kreme Philippines", "krispykreme.com.ph"], ["Potato Corner", "potatocorner.com"], ["Gerry's Grill", "gerrysgrill.com"],
      ["Cabalen", "cabalen.ph"], ["Pancake House", "pancakehouse.com.ph"], ["Tokyo Tokyo", "tokyotokyo.com.ph"],
      ["Angel's Pizza", "angelspizza.com.ph"], ["Dunkin' Philippines", "dunkin.ph"], ["Burger King Philippines", "burgerking.com.ph"],
      ["Kenny Rogers Roasters", "kennyrogers.com.ph"],
    ],
    retail: [
      ["SM Store", "smstore.com.ph"], ["Robinsons Department Store", "robinsonsdepartmentstore.com.ph"], ["Puregold", "puregold.com.ph"],
      ["National Book Store", "nationalbookstore.com"], ["Ace Hardware Philippines", "acehardware.ph"], ["Watsons Philippines", "watsons.com.ph"],
      ["Lazada Philippines", "lazada.com.ph"], ["Shopee Philippines", "shopee.ph"], ["Zalora Philippines", "zalora.com.ph"],
      ["Abenson", "abenson.com"], ["Anson's", "ansons.ph"], ["Octagon Computer Superstore", "octagon.com.ph"],
      ["Bench", "bench.com.ph"], ["Penshoppe", "penshoppe.com"], ["Rustan's", "rustans.com"],
      ["SM Supermarket", "smmarkets.ph"], ["Robinsons Supermarket", "robinsonssupermarket.com.ph"], ["AllHome", "allhome.com.ph"],
      ["Wilcon Depot", "wilcon.com.ph"], ["MR.DIY Philippines", "mrdiy.com.ph"], ["Miniso Philippines", "miniso.com.ph"],
      ["Toy Kingdom", "toykingdom.com.ph"], ["Metro Retail Stores", "metroretail.com.ph"], ["Handyman Do It Best", "handyman.com.ph"],
      ["Landmark", "landmark.com.ph"],
    ],
    banking: [
      ["BDO Unibank", "bdo.com.ph"], ["BPI", "bpi.com.ph"], ["Metrobank", "metrobank.com.ph"],
      ["Landbank", "landbank.com"], ["PNB", "pnb.com.ph"], ["Security Bank", "securitybank.com"],
      ["UnionBank", "unionbankph.com"], ["RCBC", "rcbc.com"], ["China Bank", "chinabank.ph"],
      ["EastWest Bank", "eastwestbanker.com"], ["PSBank", "psbank.com.ph"], ["AUB (Asia United Bank)", "aub.com.ph"],
      ["Maybank Philippines", "maybank.com.ph"], ["Robinsons Bank", "robinsonsbank.com.ph"], ["GoTyme Bank", "gotyme.com.ph"],
      ["Maya Bank", "maya.ph"], ["Tonik Digital Bank", "tonikbank.com"], ["CIMB Bank Philippines", "cimbbank.com.ph"],
      ["Home Credit Philippines", "homecredit.ph"], ["BillEase", "billease.ph"], ["Cebuana Lhuillier", "cebuanalhuillier.com"],
      ["Palawan Pawnshop", "palawanpawnshop.com"], ["M Lhuillier", "mlhuillier.com"], ["Bank of Commerce", "bankcom.com.ph"],
      ["DBP (Development Bank of the Philippines)", "dbp.ph"],
    ],
    healthcare: [
      ["St. Luke's Medical Center", "stluke.com.ph"], ["The Medical City", "themedicalcity.com"], ["Makati Medical Center", "makatimed.net.ph"],
      ["Asian Hospital and Medical Center", "asianhospital.com"], ["Cardinal Santos Medical Center", "cardinalsantos.com.ph"], ["Manila Doctors Hospital", "maniladoctors.com.ph"],
      ["Chong Hua Hospital", "chonghua.com.ph"], ["Davao Doctors Hospital", "ddh.com.ph"], ["Capitol Medical Center", "capitolmedical.com.ph"],
      ["Chinese General Hospital", "cghmc.com.ph"], ["QualiMed", "qualimed.com.ph"], ["Healthway Medical", "healthway.com.ph"],
      ["Hi-Precision Diagnostics", "hi-precision.com.ph"], ["Mercury Drug", "mercurydrug.com"], ["Rose Pharmacy", "rosepharmacy.com"],
      ["Southstar Drug", "southstardrug.com.ph"], ["The Generics Pharmacy", "tgp.com.ph"], ["Generika Drugstore", "generika.com.ph"],
      ["Medicard Philippines", "medicardphils.com"], ["Maxicare", "maxicare.com.ph"], ["Intellicare", "intellicare.net.ph"],
      ["PhilCare", "philcare.com.ph"], ["Belo Medical Group", "belomed.com"], ["Unilab", "unilab.com.ph"],
      ["Aventus Medical Care", "aventusmedical.com.ph"],
    ],
  };
  const merchants = Object.entries(directory).flatMap(([industry, list]) => list.map(([name, domain]) => ({ name, domain, industry })));

  function searchMerchants(q, limit) {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    const scored = merchants.map((m) => {
      const n = m.name.toLowerCase();
      const words = n.split(/[\s().+'-]+/);
      const score = n.startsWith(s) ? 0 : words.some((w) => w.startsWith(s)) ? 1 : n.includes(s) || m.domain.startsWith(s) ? 2 : 9;
      return { m, score };
    }).filter((x) => x.score < 9);
    scored.sort((a, b) => a.score - b.score || a.m.name.localeCompare(b.m.name));
    return scored.slice(0, limit || 6).map((x) => x.m);
  }

  const merchantByDomain = (domain) => merchants.find((m) => m.domain === domain);

  const industryHints = [
    ["food", ["pizza", "burger", "food", "resto", "restaurant", "cafe", "kitchen", "grill", "chicken", "bake", "coffee", "kain"]],
    ["banking", ["bank", "lend", "loan", "finance", "credit", "capital", "pay", "money", "fin"]],
    ["healthcare", ["clinic", "health", "med", "hospital", "care", "pharma", "dental", "doctor", "lab"]],
    ["retail", ["shop", "store", "mart", "retail", "mall", "fashion", "wear", "trade", "buy"]],
  ];

  function detectMerchant(email) {
    const domain = (email.split("@")[1] || "").toLowerCase().trim();
    if (knownMerchants[domain]) return { domain, ...knownMerchants[domain], detected: true };
    const dm = merchantByDomain(domain);
    if (dm) return { domain, name: dm.name, industry: dm.industry, detected: true };
    const base = domain.split(".")[0] || "enterprise";
    const name = base.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    let industry = null;
    for (const [id, words] of industryHints) {
      if (words.some((w) => base.includes(w))) { industry = id; break; }
    }
    return { domain, name, industry, detected: !!industry };
  }

  const examplePrompts = [
    "Call customers who ordered yesterday and ask them to rate the delivery from 1 to 5",
    "A Taglish hotline that answers questions about our store branches and hours",
    "Remind customers 3 days before their payment is due and record when they promise to pay",
    "A website chatbot that answers menu and allergen questions",
    "A workflow that looks up an order in our system, then calls the customer if it's delayed",
  ];

  // Variables each agent expects per contact. Like NEO, these become the
  // required (case-sensitive) CSV headers when the agent is triggered.
  const baseFields = {
    voice: ["customer_phone", "customer_name"],
    chat: ["customer_phone", "customer_name"],
    flow: ["customer_name", "customer_phone", "request"],
  };
  const extraFields = {
    "food-feedback": ["order_id", "order_date", "branch"],
    "food-delay": ["order_id", "original_eta", "new_eta"],
    "food-confirm": ["order_id", "order_items", "order_total", "delivery_address"],
    "food-reservation": ["reservation_date", "party_size"],
    "food-winback": ["last_order_date", "promo_code"],
    "food-promo": ["promo_code", "promo_end_date"],
    "food-complaint": ["ticket_id", "complaint_summary"],
    "food-faq": ["preferred_branch"],
    "food-catering": ["event_date", "guest_count"],
    "retail-cart": ["cart_items", "cart_value", "checkout_link"],
    "retail-csat": ["order_id", "delivery_date"],
    "retail-loyalty": ["points_balance", "points_expiry"],
    "retail-restock": ["product_name"],
    "retail-cod": ["order_id", "order_total", "delivery_date"],
    "bank-reminder": ["amount_due", "due_date"],
    "bank-collections": ["amount_due", "days_past_due"],
    "bank-activation": ["card_last4"],
    "bank-fraud": ["transaction_amount", "merchant_name", "transaction_time"],
    "bank-kyc": ["id_expiry_date"],
    "bank-crosssell": ["offer_name"],
    "hc-reminder": ["doctor_name", "appointment_time"],
    "hc-labs": ["test_name"],
    "hc-refill": ["medication_name"],
    "hc-followup": ["visit_date"],
    "hc-noshow": ["missed_appointment"],
    "hc-vaccine": ["child_name", "vaccine_name", "due_date"],
  };
  function csvFieldsFor(spec) {
    return [...baseFields[spec.channel], ...(extraFields[spec.templateId || spec.id] || [])];
  }

  // Fake but plausible sample values for the "Download Sample" CSV.
  const sampleNames = ["Juan Dela Cruz", "Maria Santos", "Jose Reyes", "Ana Garcia", "Carlo Mendoza"];
  function sampleValue(field, i) {
    const f = field.toLowerCase();
    if (f.includes("phone")) return "+63917" + String(i + 1).padStart(7, "0");
    if (f === "customer_name" || f.endsWith("_name") && f !== "product_name" && f !== "test_name" && f !== "medication_name" && f !== "vaccine_name" && f !== "offer_name" && f !== "merchant_name") return sampleNames[i % sampleNames.length];
    if (f.includes("date") || f.includes("expiry")) return `2026-10-${String(16 + i).padStart(2, "0")}`;
    if (f === "new_eta") return ["10:40 AM", "2:15 PM", "7:30 PM"][i % 3];
    if (f.includes("time") || f.includes("eta")) return ["10:00 AM", "1:30 PM", "6:45 PM"][i % 3];
    if (f.endsWith("_id")) return f.startsWith("ticket") ? `TCK-${3100 + i}` : `ORD-${10240 + i}`;
    if (/total|amount|value|balance/.test(f)) return ["1250.00", "980.50", "2430.00"][i % 3];
    if (f.includes("size") || f.includes("count") || f.includes("days")) return String([4, 2, 6][i % 3]);
    if (f.includes("link")) return `https://example.com/checkout/${1000 + i}`;
    if (f.includes("code")) return ["WELCOME20", "BACK15", "TREAT10"][i % 3];
    if (f === "card_last4") return ["4821", "1093", "7765"][i % 3];
    if (f === "branch" || f === "preferred_branch") return ["Makati", "BGC", "Quezon City"][i % 3];
    if (f === "request") return ["Catering for 50 guests", "Bulk order for office", "Event quote"][i % 3];
    return `sample ${f.replace(/_/g, " ")} ${i + 1}`;
  }

  return { industries, templates, freeDomains, knownMerchants, merchants, searchMerchants, merchantByDomain, detectMerchant, examplePrompts, csvFieldsFor, sampleValue };
})();
