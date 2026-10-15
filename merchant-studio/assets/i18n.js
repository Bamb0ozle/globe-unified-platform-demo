/* Local translations for the static app. Language changes keep the current DOM,
   form entries, event handlers, timers, and machine-readable agent data intact. */
(function () {
  const catalog = window.GMS_TL;
  const dictionary = new Map();
  const reverse = new Map();
  const patterns = [];
  const textSources = new WeakMap();
  const attributeSources = new WeakMap();
  const valueSources = new WeakMap();
  const edited = new WeakSet();
  const storageKey = "gms-ui-language";
  const attributes = ["placeholder", "title", "aria-label"];
  const excluded = "script, style, pre, code, .hchip, .fname, .code, [data-no-translate], [translate='no']";
  let language = "en";
  try { if (localStorage.getItem(storageKey) === "tl") language = "tl"; } catch (e) { /* in-memory language still works */ }

  const normalize = (text) => String(text).replace(/\s+/g, " ").trim();
  const escapeRegex = (text) => text.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");

  function register(english, tagalog) {
    if (typeof english !== "string" || typeof tagalog !== "string") return;
    const key = normalize(english);
    if (!key || dictionary.has(key)) return;
    dictionary.set(key, tagalog);
    if (!reverse.has(normalize(tagalog))) reverse.set(normalize(tagalog), english);
    const names = [];
    const pieces = key.split(/(\{\w+\})/).map((piece) => {
      if (/^\{\w+\}$/.test(piece)) { names.push(piece.slice(1, -1)); return "(.+?)"; }
      return escapeRegex(piece);
    });
    if (names.length) patterns.push({ regex: new RegExp("^" + pieces.join("") + "$"), names, tagalog });
    // Saved agents can still contain the legacy placeholder.
    if (english.includes("{enterprise}")) {
      register(english.replace(/\{enterprise\}/g, "{merchant}"), tagalog.replace(/\{enterprise\}/g, "{merchant}"));
    }
  }
  Object.entries(catalog.phrases).forEach(([english, tagalog]) => {
    register(english, tagalog);
    if (/ \(MCP\)$/.test(english)) register(english.slice(0, -6), tagalog.replace(/ \(MCP\)$/, ""));
  });

  function translate(value, target, depth) {
    const text = String(value == null ? "" : value);
    if ((target || language) !== "tl") return text;
    const parts = /^(\s*)([\s\S]*?)(\s*)$/.exec(text);
    const key = normalize(parts[2]);
    if (!key) return text;
    const level = depth || 0;
    let result = dictionary.get(key);
    if (result === undefined && level < 5) {
      for (const pattern of patterns) {
        const match = pattern.regex.exec(key);
        if (!match) continue;
        const values = {};
        pattern.names.forEach((name, i) => {
          const raw = match[i + 1];
          values[name] = /^(enterprise|merchant|persona|email|domain|file|headers|variable|number)$/.test(name)
            ? raw : translate(raw, "tl", level + 1);
        });
        result = pattern.tagalog.replace(/\{(\w+)\}/g, (token, name) => values[name] === undefined ? token : values[name]);
        break;
      }
    }
    if (result === undefined && level < 5) {
      // Icons, navigation arrows, and separators are presentation, not message keys.
      const decorated = /^([^\p{L}\p{N}{}]*)(.*?)([^\p{L}\p{N}{}]*)$/u.exec(key);
      if (decorated[1]) {
        const rest = key.slice(decorated[1].length);
        const translated = translate(rest, "tl", level + 1);
        if (translated !== rest) result = decorated[1] + translated;
      }
      if (result === undefined && decorated[3]) {
        const rest = key.slice(0, -decorated[3].length);
        const translated = translate(rest, "tl", level + 1);
        if (translated !== rest) result = translated + decorated[3];
      }
      if (result === undefined && (decorated[1] || decorated[3]) && decorated[2]) {
        const translated = translate(decorated[2], "tl", level + 1);
        if (translated !== decorated[2]) result = decorated[1] + translated + decorated[3];
      }
      if (result === undefined && /\s[·›]\s|,\s/.test(key)) {
        const chunks = key.split(/(\s+[·›]\s+|,\s*)/);
        const translated = chunks.map((chunk) => translate(chunk, "tl", level + 1)).join("");
        if (translated !== key) result = translated;
      }
      if (result === undefined && /\d/.test(key)) {
        const translated = key.replace(/\b(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/g,
          (month) => dictionary.get(month) || month);
        if (translated !== key) result = translated;
      }
    }
    return result === undefined ? text : parts[1] + result + parts[3];
  }

  function registerData(data) {
    for (const list of Object.values(data.templates)) {
      for (const template of list) {
        const localized = catalog.templates[template.id];
        if (!localized) continue;
        ["name", "blurb", "greeting", "pitch", "reply"].forEach((key) => register(template[key], localized[key]));
        template.stages.forEach((stage, i) => register(stage, localized.stages[i]));
        template.metrics.forEach((metric, i) => register(metric.desc, localized.metrics[i]));
        (template.transcript || []).forEach((line, i) => register(line[1], localized.transcript && localized.transcript[i]));
        (template.tools || []).forEach((tool, i) => {
          const target = localized.tools && localized.tools[i];
          register(tool, target);
          if (target) register(tool.replace(/\s*\(MCP\)/, ""), target.replace(/\s*\(MCP\)/, ""));
        });
      }
    }
    data.examplePrompts.forEach((prompt, i) => {
      const localized = catalog.examplePrompts[i];
      register(prompt, localized);
      if (prompt.length > 62) register(prompt.slice(0, 60) + "…", localized.length > 62 ? localized.slice(0, 60) + "…" : localized);
    });
    const topics = ["Feedback", "Order", "Delivery", "Delay", "Payment", "Loan", "Booking", "Reservation", "Menu", "Store Info", "Promo", "Complaint", "Returns", "Reminder", "FAQ"];
    topics.forEach((first) => topics.forEach((second) =>
      register(first + " " + second, translate(first, "tl") + " " + translate(second, "tl"))));
    patterns.sort((a, b) => b.regex.source.length - a.regex.source.length);
    refresh();
  }

  function updateText(node) {
    if (node.parentElement && node.parentElement.closest(excluded + ", textarea")) return;
    const current = node.nodeValue;
    let record = textSources.get(node);
    if (!record || current !== record.output) record = { source: current, output: current };
    const next = translate(record.source);
    record.output = next;
    textSources.set(node, record);
    if (next !== current) node.nodeValue = next;
  }

  function updateElement(element) {
    let records = attributeSources.get(element);
    if (!records) { records = {}; attributeSources.set(element, records); }
    attributes.forEach((name) => {
      if (!element.hasAttribute(name)) return;
      const current = element.getAttribute(name);
      let record = records[name];
      if (!record || current !== record.output) record = { source: current, output: current };
      record.output = translate(record.source);
      records[name] = record;
      if (record.output !== current) element.setAttribute(name, record.output);
    });
    if (element.hasAttribute("data-i18n-value") && !edited.has(element)) {
      let record = valueSources.get(element);
      if (record && element.value !== record.output) { edited.add(element); return; }
      if (!record) record = { source: element.value, output: element.value };
      record.output = translate(record.source);
      valueSources.set(element, record);
      if (element.value !== record.output) element.value = record.output;
    }
  }

  function visit(node) {
    if (node.nodeType === 3) { updateText(node); return; }
    if (node.nodeType !== 1 || node.matches(excluded)) return;
    // HTML entities and DOM insertions can split one phrase into adjacent text nodes.
    // Join their original messages so translation and switching back stay reversible.
    for (let child = node.firstChild; child;) {
      if (child.nodeType !== 3) { child = child.nextSibling; continue; }
      const group = [child];
      let next = child.nextSibling;
      while (next && next.nodeType === 3) { group.push(next); next = next.nextSibling; }
      if (group.length > 1) {
        const source = group.map((text) => {
          const record = textSources.get(text);
          return record && record.output === text.nodeValue ? record.source : text.nodeValue;
        }).join("");
        child.nodeValue = source;
        textSources.set(child, { source, output: source });
        group.slice(1).forEach((text) => text.remove());
      }
      child = next;
    }
    updateElement(node);
    Array.from(node.childNodes).forEach(visit);
  }

  function switchers() {
    document.querySelectorAll("[data-language-switch]").forEach((mount) => {
      if (!mount.hasAttribute("data-language-mounted")) {
        mount.setAttribute("data-language-mounted", "");
        mount.innerHTML = '<div class="language-switch" role="group" aria-label="Interface language" data-no-translate>' +
          '<button type="button" data-ui-language="en" lang="en" title="English" aria-label="English">EN<span> (English)</span></button>' +
          '<button type="button" data-ui-language="tl" lang="tl" title="Tagalog" aria-label="Tagalog">tl<span> (Tagalog)</span></button></div>';
      }
      const group = mount.firstElementChild;
      group.setAttribute("aria-label", language === "tl" ? "Wika ng pahina" : "Interface language");
      mount.querySelectorAll("[data-ui-language]").forEach((button) => {
        button.setAttribute("aria-pressed", String(button.dataset.uiLanguage === language));
      });
    });
  }

  const observe = () => observer.observe(document.body, {
    subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: attributes,
  });
  const observer = new MutationObserver((mutations) => {
    observer.disconnect();
    switchers();
    const roots = new Set(mutations.map((mutation) => mutation.target.nodeType === 3 ? mutation.target.parentElement : mutation.target));
    roots.forEach((root) => { if (root && root.isConnected) visit(root); });
    observe();
  });

  function refresh() {
    observer.disconnect();
    document.documentElement.lang = language;
    switchers();
    visit(document.body);
    observe();
  }

  function setLanguage(next) {
    if (next !== "en" && next !== "tl") return;
    language = next;
    try { localStorage.setItem(storageKey, language); } catch (e) { /* in-memory language still works */ }
    refresh();
  }

  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-ui-language]");
    if (button) { event.preventDefault(); setLanguage(button.dataset.uiLanguage); }
  });
  document.addEventListener("input", (event) => {
    if (event.target.matches("[data-i18n-value]")) edited.add(event.target);
  }, true);

  window.GMS_I18N = {
    t: translate, registerData, refresh, setLanguage,
    get language() { return language; },
    source: (text) => reverse.get(normalize(text)) || text,
    setValue(element, source) {
      edited.delete(element);
      valueSources.set(element, { source, output: translate(source) });
      element.value = translate(source);
    },
  };
  refresh();
})();
