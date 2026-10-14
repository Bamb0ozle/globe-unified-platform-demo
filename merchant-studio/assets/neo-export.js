/* Builds NEO import JSON for voice, chat and flow agents.
   Field names follow three real NEO exports (voice-agent-export, chatbot-export,
   flow-agent-export). Credentials, internal hosts and workspace IDs are blanked
   or replaced with <placeholders>. Flow nodes are abridged (component code omitted). */

window.GMS_NEO = (function () {
  const WORKSPACE = "<globe-neo-workspace-id>";

  // ---------- helpers ----------
  const alnum = "abcdefghijklmnopqrstuvwxyz0123456789";
  function cuid() {
    let s = "";
    for (let i = 0; i < 24; i++) s += alnum[Math.floor(Math.random() * alnum.length)];
    return s;
  }
  function uuid() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
    });
  }
  function shortId() {
    const a = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let s = "";
    for (let i = 0; i < 5; i++) s += a[Math.floor(Math.random() * a.length)];
    return s;
  }
  const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const pretty = (o) => JSON.stringify(o, null, 4);
  const fill = (s, ctx) => String(s || "").replace(/\{merchant\}/g, ctx.merchant).replace(/\{persona\}/g, ctx.persona);

  const LANGS = {
    en: { label: "English", code: "en-US", candidates: ["en-US", "fil-PH"] },
    fil: { label: "Filipino", code: "fil-PH", candidates: ["fil-PH", "en-US"] },
    taglish: { label: "Taglish", code: "fil-PH", candidates: ["fil-PH", "en-US"] },
  };

  // ---------- voice ----------
  function voiceExport(spec, ctx) {
    const lang = LANGS[spec.language] || LANGS.en;
    const persona = ctx.persona;
    const ids = spec.stages.map((s, i) => (i === 0 ? "greeting-and-route" : slug(s) || "stage-" + i));
    const transferId = uuid();

    const nodes = spec.stages.map((name, i) => {
      const isFirst = i === 0;
      const isLast = i === spec.stages.length - 1;
      const type = isFirst ? "start" : isLast ? "end" : "internal";
      const next = isLast
        ? [{ condition: "", nextStageId: "" }]
        : [{ condition: `The "${name}" step is complete`, nextStageId: ids[i + 1] }];
      if (isFirst) next.push({ condition: "Caller explicitly asks for a human agent or person", nextStageId: transferId });
      return {
        data: {
          label: name,
          name: "",
          nextStages: next,
          prompt: stagePrompt(name, i, spec, ctx),
          type,
        },
        dragging: false,
        id: ids[i],
        measured: { width: 320, height: 223 },
        position: { x: 420 * i, y: i % 2 ? 120 : -120 },
        selected: false,
        type,
      };
    });

    const transferTemplate = {
      _type: "Action",
      ticketing_api_url: strInput("ticketing_api_url", "Ticketing API URL", "Ticketing system API base URL", "", true),
      ticketing_api_key: { ...strInput("ticketing_api_key", "API Key", "API key for creating voice tickets", "", true), _input_type: "SecretStrInput", password: true },
      bridge_base_url: strInput("bridge_base_url", "Bridge Base URL", "WebSocket base URL for agent stream (e.g. wss://voice.example.com)", "", true),
      say_message: strInput("say_message", "Hold Message", "Message spoken to caller before transfer", "Please hold while I connect you to an agent.", false),
    };
    nodes.push({
      id: transferId,
      type: "inhouse_action",
      position: { x: 420, y: 420 },
      data: {
        label: "Transfer to Human",
        nextStages: [{ condition: "", nextStageId: "" }],
        description: "Transfer the caller to a human support agent",
        display_name: "Transfer to Human",
        icon: "PhoneForwarded",
        name: "transfer_to_human",
        template: transferTemplate,
        type: "action_inhouse_transfer_to_human",
      },
      measured: { width: 320, height: 469 },
      selected: false,
      dragging: false,
    });

    const edges = [];
    nodes.forEach((n) =>
      n.data.nextStages.forEach((ns, h) => {
        if (ns.nextStageId) edges.push({ animated: true, id: `xy-edge__${n.id}-${ns.nextStageId}-${h}`, source: n.id, sourceHandle: `handle-${h}`, target: ns.nextStageId, type: "smoothstep" });
      })
    );

    const data = nodes.map((n) => ({
      functions: [],
      id: n.id,
      name: n.data.label,
      nextStages: n.data.nextStages,
      prompt: n.data.prompt || "",
      sourcePosition: "",
      targetPosition: "",
      type: n.type === "inhouse_action" ? "internal" : n.type,
      inhouse_actions: n.type === "inhouse_action" ? [{ type: n.data.type, template: transferTemplate }] : [],
      custom_actions: [],
    }));

    const props = {};
    spec.metrics.forEach((mt) => (props[mt.name] = { description: mt.desc, type: mt.type === "number" ? "number" : mt.type }));

    const json = {
      original_agent_draft_config: {
        agent: {
          agent_group: null,
          default_language: lang.code,
          description: fill(spec.purpose, ctx),
          enable_fillers: false,
          id: null,
          name: spec.name,
          provider: pretty({
            provider_in_use: "bedrock",
            bedrock: { use_client: "boto3", region_name: "us-east-1", endpoint_url: "", provider: "anthropic", model_id: "us.anthropic.claude-haiku-4-5-20251001-v1:0", temperature: 0.3, max_tokens: 300, streaming: true },
          }),
          workspace_id: WORKSPACE,
        },
        conversation_metrics: spec.metrics.map((mt) => ({
          agentType: "voice", description: mt.desc, id: null, name: mt.name, type: mt.type,
          voiceAgentId: null, voiceAgentVersionId: null, workspaceId: WORKSPACE,
        })),
        function: null,
        generic_prompt: {
          definition: genericPrompt(spec, ctx, lang),
          id: null,
          knowledge_base: `# ${ctx.merchant} - Knowledge Base\n\n(Upload or paste your FAQs, policies and product details here.)`,
        },
        id: null,
        kpis: spec.metrics.filter((mt) => mt.type === "boolean").map((mt) => ({
          agentType: "voice",
          description: mt.desc,
          expression: { type: "SINGLE", conditions: [{ field: mt.name, value: "", operator: "is_true", fieldType: "boolean", timeConfig: { type: "RELATIVE", duration: "7d" }, aggregation: "count" }] },
          generatedSql: "",
          id: null,
          name: titleCase(mt.name),
          outputFieldName: mt.name,
        })),
        output_detail: {
          id: null,
          transcript_schema: pretty({ transcript_schema: { description: "Summary parameters to understand how the call went", properties: props } }),
          transcript_summary_model_provider_config: pretty({ provider_in_use: "bedrock" }),
        },
        phone: {
          agents: null,
          bot_phone_number: "",
          id: null,
          // Globe telephony integration details are not defined yet; left as a placeholder on purpose.
          phone_config: pretty({ provider: "<globe-telephony-provider>", record: true, status_callback: "", status_callback_method: "POST", status_callback_event: ["initiated", "ringing", "answered", "completed"], extraParamsArray: [] }),
          type: spec.direction || "outbound",
        },
        remark: null,
        speech_config: {
          call_termination_configs: pretty({ terminateCallOnKeyword: true, keywords: "bye, goodbye, paalam" }),
          config: "{}",
          id: null,
          synthesizer_configs: pretty({ provider_in_use: "elevenlabs", voice_id: "", model_id: "eleven_turbo_v2_5", stability: 0.8, similarity_boost: 1, speed: 0.9, api_key: "" }),
          transcriber_configs: pretty({ provider_in_use: "azure", azure: { vad_silence_threshold: 0.7, candidate_languages: lang.candidates, language: lang.code, use_external_vad: false, vad_sample_rate: 16000, speech_key: "", speech_region: "" } }),
          vad_configs: null,
          voice_id: "",
        },
        stage: {
          id: null,
          initial_message: fill(spec.greeting, ctx),
          prompts: pretty({ graph: { nodes, edges }, data }),
          // NEO dials the number stored in this exact variable name.
          variables: pretty({ stages: voiceVars(spec).map((name) => ({ name, vtype: "String" })), initialMessage: [] }),
        },
        status: "AVAILABLE",
        updated_at: new Date().toISOString(),
      },
    };
    return { format: "voice-agent-export", filename: `voice-agent-export-${spec.name}.json`, json };

    function stagePrompt(name, i, spec, ctx) {
      const lines = [`### ${name}`, "", "### Instructions for this stage"];
      if (i === 0) lines.push(`- The greeting has already been spoken: "${fill(spec.greeting, ctx)}"`, "- Wait for the caller's reply, then move to the next step.");
      else lines.push(`- Handle the "${name}" step for ${ctx.merchant}.`, `- Keep replies under 2 sentences; this is a phone call.`);
      if (spec.language === "taglish") lines.push("- Reply in the language of the caller's most recent message (Taglish or English).");
      return lines.join("\n");
    }
  }

  // NEO dials customer_phone, so it is always the first stage variable.
  function voiceVars(spec) {
    const f = spec.csvFields || ["customer_phone"];
    return ["customer_phone", ...f.filter((x) => x !== "customer_phone")];
  }

  function genericPrompt(spec, ctx, lang) {
    return [
      "## VoiceAgentSetup", "",
      "## Role",
      `You are ${ctx.persona}, ${ctx.merchant}'s ${spec.direction === "inbound" ? "inbound" : "outbound"} voice assistant. ${fill(spec.purpose, ctx)}`, "",
      "## Conversation steps",
      ...spec.stages.map((s, i) => `${i + 1}. ${s}`), "",
      "## Guidelines",
      `- Default language: ${lang.label}.`,
      "- Be warm, concise and polite. Never invent facts, prices or policies.",
      "- Transfer to a human if the customer asks for one or raises a serious concern.",
    ].join("\n");
  }

  function strInput(name, display, info, value, required) {
    return { _input_type: "StrInput", advanced: false, display_name: display, dynamic: false, info, list: false, name, placeholder: "", required, show: true, type: "str", value };
  }

  // ---------- chat (typebot) ----------
  function chatExport(spec, ctx) {
    const v = (name) => ({ id: "v" + cuid(), name, isSessionVariable: true });
    const vars = [v("userQuery"), v("customerName"), v("menuChoice"), ...(spec.csvFields || []).map(v)];
    const text = (t) => ({ id: cuid(), type: "text", content: { richText: [{ type: "p", children: [{ text: t }] }] } });

    const menuBlockId = cuid();
    const items = spec.stages.map((s) => ({ id: cuid(), content: s }));
    const greetGroup = {
      id: cuid(), title: "Greeting", graphCoordinates: { x: 0, y: 0 },
      blocks: [text(fill(spec.greeting, ctx)), { id: menuBlockId, type: "choice input", items, options: { variableId: vars[2].id } }],
    };
    const topicGroups = spec.stages.map((s, i) => ({
      id: cuid(), title: s, graphCoordinates: { x: 480, y: i * 260 },
      blocks: [
        text(i === 0 ? fill(spec.pitch, ctx) : `Here's what I can share about ${s.toLowerCase()} at ${ctx.merchant}.`),
        { id: cuid(), type: "text input", options: { variableId: vars[0].id } },
        { id: cuid(), type: "Jump", options: { groupId: greetGroup.id, blockId: menuBlockId } },
      ],
    }));
    const startEdge = { id: cuid(), from: { eventId: null }, to: { groupId: greetGroup.id } };
    const event = { id: cuid(), outgoingEdgeId: startEdge.id, graphCoordinates: { x: -400, y: 0 }, type: "start" };
    startEdge.from = { eventId: event.id };
    const edges = [startEdge, ...items.map((it, i) => ({ id: cuid(), from: { blockId: menuBlockId, itemId: it.id }, to: { groupId: topicGroups[i].id } }))];

    const id = cuid();
    const publicId = `${slug(spec.name)}-${id.slice(-7)}`;
    const now = new Date().toISOString();
    const credIds = ["whatsApp", "telegram", "threeDolphins", "microsoftTeams", "facebook", "directline", "slack", "viber", "zalo", "zoho", "mail", "scheduling"];
    const typebot = {
      version: "6", id, name: spec.name, events: [event], groups: [greetGroup, ...topicGroups], edges, variables: vars,
      theme: {}, selectedThemeTemplateId: null,
      settings: {
        general: { isBrandingEnabled: false, isTypingEmulationEnabled: true, isInputPrefillEnabled: false, isHideQueryParamsEnabled: true, isNewResultOnRefreshEnabled: true, messageAggregationDebounceMs: 1000, rememberUser: { isEnabled: false, storage: "session" } },
        metadata: { description: fill(spec.purpose, ctx) },
        versionSettings: { maxVersions: 3, versioningRules: ["any"] },
        typingEmulation: { enabled: true, speed: 400, maxDelay: 3, delayBetweenBubbles: 0, isDisabledOnFirstMessage: true },
      },
      createdAt: now, updatedAt: now, icon: "", analyticsId: null, publicId, customDomain: null, workspaceId: WORKSPACE,
      resultsTablePreferences: null, isArchived: false, isClosed: false, isDisabled: false,
    };
    credIds.forEach((c) => (typebot[c + "CredentialsId"] = null));
    Object.assign(typebot, { webhookCredentialsIds: [], databricksCredentialsId: null, jiraCredentialsId: null, playgroundCredentialsId: null, riskLevel: null, tags: null, description: fill(spec.purpose, ctx), remark: null, status: "DRAFT", deployedFromCoworkerId: null });

    const json = { typebot, kpis: [], conversationMetrics: [], exportVersion: "1.0" };
    return { format: "chatbot-export", filename: `chatbot-export-${publicId}.json`, json };
  }

  // ---------- flow (langflow-style agentic flow) ----------
  function flowExport(spec, ctx) {
    const mk = (type, display, description, template, x, y) => {
      const id = `${type}-${shortId()}`;
      return {
        data: { description, display_name: display, id, node: { description, display_name: display, template, base_classes: ["Message"], beta: false, frozen: false, icon: type, legacy: false, minimized: false, pinned: false, tool_mode: false }, showNode: true, type },
        dragging: false, id, measured: { height: 285, width: 320 }, position: { x, y }, selected: false, type: "genericNode",
      };
    };
    const field = (name, display, value, input) => ({ _input_type: input || "MessageTextInput", display_name: display, name, value, show: true, advanced: false });

    const systemPrompt = `You are ${ctx.persona}, ${ctx.merchant}'s assistant. ${fill(spec.purpose, ctx)}\n\nSteps:\n${spec.stages.map((s, i) => `${i + 1}. ${s}`).join("\n")}`;
    const input = mk("ChatInput", "Input", "Get chat inputs from the Playground.", { input_value: field("input_value", "Input Text", "") }, -350, 0);
    const prompt = mk("Prompt", "Prompt", "Create a prompt template with dynamic variables.", { template: field("template", "Template", systemPrompt, "PromptInput") }, -350, -400);
    const agent = mk("Agent", "Agent", "Define the agent's instructions, then enter a task to complete using tools.", {
      agent_description: field("agent_description", "Agent Description", "A helpful assistant with access to the following tools:", "MultilineInput"),
      system_prompt: field("system_prompt", "Agent Instructions", "", "MultilineInput"),
      model_provider: field("model_provider", "Model Provider", "Amazon", "DropdownInput"),
      model_id: field("model_id", "Model", "us.anthropic.claude-sonnet-4-5-20250929-v1:0", "DropdownInput"),
      region_name: field("region_name", "Region", "us-east-1", "DropdownInput"),
      max_iterations: field("max_iterations", "Max Iterations", 15, "IntInput"),
      enable_input_guardrail: field("enable_input_guardrail", "Input Guardrail", true, "BoolInput"),
      enable_output_guardrail: field("enable_output_guardrail", "Output Guardrail", true, "BoolInput"),
      knowledge_base_name: field("knowledge_base_name", "Knowledge Base", "", "DropdownInput"),
      workspace_id: field("workspace_id", "Workspace ID", WORKSPACE, "StrInput"),
    }, 250, 0);
    const memory = mk("Memory", "Message History", "Retrieves stored chat messages.", { n_messages: field("n_messages", "Number of Messages", 100, "IntInput") }, -350, 450);
    const date = mk("CurrentDate", "Current Date", "Returns the current date and time.", { timezone: field("timezone", "Timezone", "Asia/Manila", "DropdownInput") }, -350, 800);
    const output = mk("ChatOutput", "Output", "Display a chat message in the Playground.", { input_value: field("input_value", "Text", "") }, 800, 0);

    const toolNodes = (spec.tools || []).filter((t) => !/current date/i.test(t)).map((t, i) =>
      /voice agent/i.test(t)
        ? mk("VoiceAgentCall", "Voice Agent Call", "Trigger an outbound call with a NEO voice agent.", { voice_agent_id: field("voice_agent_id", "Voice Agent", "", "DropdownInput") }, -350, 1150 + i * 350)
        : mk("MCPClient", t.replace(/\s*\(MCP\)/, ""), "Connect to an MCP server to use its tools.", { mcp_server: field("mcp_server", "MCP Server", "", "DropdownInput"), workspace_id: field("workspace_id", "Workspace ID", WORKSPACE, "StrInput") }, -350, 1150 + i * 350)
    );

    const nodes = [input, prompt, agent, memory, date, output, ...toolNodes];
    const edge = (src, srcName, srcType, tgt, tgtField, tgtTypes) => {
      const sh = { dataType: src.data.type, id: src.id, name: srcName, output_types: [srcType] };
      const th = { fieldName: tgtField, id: tgt.id, inputTypes: tgtTypes, type: "str" };
      const enc = (o) => JSON.stringify(o).replace(/"/g, "œ");
      return { animated: false, className: "", data: { sourceHandle: sh, targetHandle: th }, id: `reactflow__edge-${src.id}${enc(sh)}-${tgt.id}${enc(th)}`, selected: false, source: src.id, sourceHandle: enc(sh), target: tgt.id, targetHandle: enc(th) };
    };
    const edges = [
      edge(prompt, "prompt", "Message", agent, "system_prompt", ["Message"]),
      edge(input, "message", "Message", agent, "input_value", ["Message"]),
      edge(agent, "response", "Message", output, "input_value", ["Message"]),
      edge(memory, "component_as_tool", "Tool", agent, "tools", ["Tool"]),
      edge(date, "component_as_tool", "Tool", agent, "tools", ["Tool"]),
      ...toolNodes.map((t) => edge(t, "component_as_tool", "Tool", agent, "tools", ["Tool"])),
    ];

    const json = {
      data: { edges, nodes, viewport: { x: 700, y: 60, zoom: 0.5 } },
      description: fill(spec.purpose, ctx),
      endpoint_name: null,
      id: uuid(),
      is_component: false,
      last_tested_version: "0.4.3",
      name: spec.name,
      tags: ["agents", ctx.industryId || "custom"],
    };
    return { format: "flow-agent-export", filename: `flow-agent-export-${spec.name}.json`, json };
  }

  function titleCase(s) {
    return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }

  function build(spec, ctx) {
    if (spec.channel === "chat") return chatExport(spec, ctx);
    if (spec.channel === "flow") return flowExport(spec, ctx);
    return voiceExport(spec, ctx);
  }

  // ---------- mock "prompt -> agent spec" (keyword based, no LLM) ----------
  const STOP = new Set("that this with from they their them have will would should could when what your about into after then than make want need customers customer agent build create using our ask asks and the for who hotline answer answers answering question questions call calls phone voice chat chatbot website workflow flow assistant taglish english filipino tagalog".split(" "));
  const words = (s) => (s.toLowerCase().match(/[a-z0-9]+/g) || []).filter((w) => w.length > 3 && !STOP.has(w));

  function specFromPrompt(prompt, channelChoice, industryId) {
    const p = prompt.toLowerCase();
    const reasons = [];

    let channel = channelChoice;
    if (!channel || channel === "auto") {
      if (/\b(workflow|flow|look ?up|system|api|integrat|automat|crm|database)\b/.test(p)) channel = "flow";
      else if (/\b(chat ?bot|chat|website|messenger|viber|whatsapp|web widget)\b/.test(p)) channel = "chat";
      else channel = "voice";
      const why = channel === "flow" ? "mentions systems / multi-step work" : channel === "chat" ? "mentions chat or website" : "mentions calls or phone";
      reasons.push(["Channel", `${label(channel)}, because your prompt ${why}`]);
    } else reasons.push(["Channel", `${label(channel)} (you chose this)`]);

    const direction = channel !== "voice" ? null : /\b(hotline|inbound|answer(s|ing)? (calls|questions)|when (people|customers|callers) call|receive calls)\b/.test(p) ? "inbound" : "outbound";
    if (direction) reasons.push(["Direction", direction === "inbound" ? "Inbound: customers call in" : "Outbound: the agent calls your customers"]);

    const language = /\b(taglish|tagalog|filipino)\b/.test(p) ? "taglish" : "en";
    reasons.push(["Language", language === "taglish" ? "Taglish (Filipino + English)" : "English"]);

    // closest template across all industries, own industry gets a small boost
    const pw = new Set(words(prompt));
    let best = null, bestScore = 0, bestInd = null;
    Object.entries(GMS_DATA.templates).forEach(([ind, list]) =>
      list.forEach((t) => {
        const tw = new Set(words(`${t.name} ${t.blurb} ${t.stages.join(" ")}`));
        if (t.channel !== channel) return;
        let score = 0;
        pw.forEach((w) => { if (tw.has(w) || [...tw].some((x) => x.startsWith(w.slice(0, 5)))) score++; });
        // own industry needs 2 keyword hits, other industries need 3
        if (score < (ind === industryId ? 2 : 3)) return;
        if (ind === industryId) score += 1.5;
        if (score > bestScore) { best = t; bestScore = score; bestInd = ind; }
      })
    );
    const match = best;
    if (match) reasons.push(["Closest template", `${match.name} (${GMS_DATA.industries.find((i) => i.id === bestInd).name}), adapted to your request`]);
    else reasons.push(["Closest template", "None close enough, so it was built from scratch"]);

    const generic = {
      voice: direction === "inbound"
        ? ["Greet and route", "Understand the caller's request", "Answer from knowledge base", "Transfer to human if needed", "Farewell"]
        : ["Greet and confirm identity", "Explain why we're calling", "Capture the customer's response", "Handle questions or objections", "Thank and close"],
      chat: ["Main menu", "Answer from knowledge base", "Collect customer details", "Talk to a person"],
      flow: ["Understand the request", "Call the right tools", "Compose the answer", "Respond or hand off"],
    }[channel];

    let metrics = match && match.channel === channel ? match.metrics.slice() : [{ name: "goal_achieved", type: "boolean", desc: "Was the goal of the conversation achieved? True or False." }, { name: "customer_sentiment", type: "string", desc: "Overall sentiment: positive, neutral or negative." }];
    if (/\b(rate|rating|score|1 to 5|1-5)\b/.test(p) && !metrics.some((x) => x.type === "number")) metrics.unshift({ name: "rating", type: "number", desc: "Rating the customer gave." });
    if (/promise to pay|promises to pay/.test(p) && !metrics.some((x) => x.name === "promise_to_pay")) metrics.unshift({ name: "promise_to_pay", type: "boolean", desc: "Did the customer commit to pay? True or False." });
    reasons.push(["Outcomes tracked", metrics.map((x) => x.name).join(", ")]);

    const useMatch = match && match.channel === channel;
    const name = useMatch ? match.name : nameFromPrompt(prompt, channel, direction);
    const tools = channel === "flow" ? (useMatch && match.tools) || toolsFromPrompt(p) : undefined;
    if (tools) reasons.push(["Tools", tools.join(", ")]);

    const greeting = useMatch ? match.greeting
      : channel === "voice" && direction === "outbound" ? "Hi, this is {persona} from {merchant}. Do you have a quick minute?"
      : channel === "voice" ? "Thank you for calling {merchant}! This is {persona}. How can I help you today?"
      : "Hi! I'm {persona}, {merchant}'s assistant. How can I help?";

    return {
      spec: {
        name, channel, direction, language,
        purpose: prompt.trim(),
        greeting,
        pitch: useMatch ? match.pitch : "Sure, let me help you with that.",
        reply: useMatch ? match.reply : "Okay, thank you.",
        stages: useMatch ? match.stages.slice() : generic,
        metrics, tools,
        transcript: useMatch ? match.transcript : null,
        source: "prompt",
        basedOn: match ? match.name : null,
      },
      reasons,
    };
  }

  function toolsFromPrompt(p) {
    const t = [];
    if (/order|system|crm|database|look ?up/.test(p)) t.push("Order system lookup (MCP)");
    if (/\bcall|phone|voice/.test(p)) t.push("Voice agent call");
    if (/email/.test(p)) t.push("Email sender (MCP)");
    if (/sms|text/.test(p)) t.push("SMS sender (MCP)");
    t.push("Current date");
    return t;
  }

  const TOPICS = [
    [/feedback|rate|rating|survey/, "Feedback"], [/order/, "Order"], [/deliver/, "Delivery"], [/delay|late/, "Delay"],
    [/payment|due/, "Payment"], [/loan/, "Loan"], [/appointment|booking|book/, "Booking"], [/reserv/, "Reservation"],
    [/menu|allergen/, "Menu"], [/branch|store|hours|location/, "Store Info"], [/promo|offer|discount/, "Promo"],
    [/complain/, "Complaint"], [/refund|return/, "Returns"], [/remind/, "Reminder"], [/faq|question/, "FAQ"],
  ];

  function nameFromPrompt(prompt, channel, direction) {
    const p = prompt.toLowerCase();
    const topics = TOPICS.filter(([re]) => re.test(p)).map(([, l]) => l).slice(0, 2);
    const suffix = channel === "voice" ? (direction === "inbound" ? "Hotline" : "Call Agent") : channel === "chat" ? "Chat Assistant" : "Flow";
    return (topics.length ? topics.join(" ") : "Custom") + " " + suffix;
  }

  function label(ch) {
    return { voice: "Voice agent", chat: "Chat agent", flow: "Agentic flow" }[ch];
  }

  return { build, specFromPrompt, fill, LANGS, label };
})();
