/* Offline playback for the fixed English and Tagalog KYC sample recordings. */
(function () {
  const I18N = window.GMS_I18N;
  const recordings = window.GMS_KYC_AUDIO;
  const escape = (value) => String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character]));
  let active = null;
  let selected = null;

  function matches(spec) {
    return spec.channel === "voice" && (spec.templateId === "bank-kyc" || spec.id === "bank-kyc" || spec.basedOn === "KYC document reminder");
  }

  function markup() {
    return `<div class="kyc-audio">
      <div class="kyc-audio-head"><b>KYC sample recording</b>
        <div class="language-switch" role="group" aria-label="Recording language">
          <button type="button" data-kyc-language="en" lang="en" aria-pressed="false" data-no-translate>EN (English)</button>
          <button type="button" data-kyc-language="tl" lang="tl" aria-pressed="false" data-no-translate>tl (Tagalog)</button>
        </div>
      </div>
      <p class="small muted">This fixed sample uses Joy and a sample bank.</p>
      <audio controls preload="metadata" aria-label="KYC sample audio">Your browser does not support audio playback.</audio>
      <p class="error hidden" data-kyc-error role="status">Audio unavailable. Reload the page to try again.</p>
    </div>
    <div class="transcript kyc-transcript" data-kyc-transcript></div>`;
  }

  function stop() {
    if (active) active.destroy();
    active = null;
  }

  function mount(root, callbacks) {
    stop();
    callbacks = callbacks || {};
    const audio = root.querySelector("audio");
    const transcript = root.querySelector("[data-kyc-transcript]");
    const error = root.querySelector("[data-kyc-error]");
    const buttons = Array.from(root.querySelectorAll("[data-kyc-language]"));
    let recording;
    let messages = [];
    let highlighted = -1;
    let destroyed = false;
    let request = 0;

    function state(value) {
      if (!destroyed && callbacks.onState) callbacks.onState(value);
    }

    function sync() {
      const time = audio.currentTime || 0;
      const index = recording.turns.findIndex((turn) => time >= turn.start && time < turn.end);
      if (index !== highlighted) {
        messages.forEach((message, i) => message.classList.toggle("speaking", i === index));
        highlighted = index;
        if (index >= 0 && !audio.paused) {
          const message = messages[index];
          transcript.scrollTop = Math.max(0, message.offsetTop - transcript.offsetTop - 12);
        }
      }
      if (callbacks.onTime) callbacks.onTime(time);
      if (callbacks.onSpeaker) callbacks.onSpeaker(!audio.paused && index >= 0 ? recording.turns[index].who : null);
    }

    function changeLanguage(language) {
      if (!recordings[language]) return;
      request++;
      audio.pause();
      selected = language;
      recording = recordings[language];
      audio.src = recording.src;
      audio.lang = recording.lang;
      audio.load();
      error.classList.add("hidden");
      buttons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.kycLanguage === language)));
      transcript.lang = recording.lang;
      transcript.innerHTML = recording.turns.map((turn) => `<div class="msg ${turn.who}"><span class="who">${turn.who === "agent" ? escape(recording.persona) + " · AI" : "Customer"}</span><span data-no-translate>${escape(turn.text)}</span></div>`).join("");
      messages = Array.from(transcript.querySelectorAll(".msg"));
      highlighted = -1;
      transcript.scrollTop = 0;
      state("idle");
      if (callbacks.onTime) callbacks.onTime(0);
      if (callbacks.onSpeaker) callbacks.onSpeaker(null);
    }

    function failed() {
      error.classList.remove("hidden");
      state("error");
      if (callbacks.onSpeaker) callbacks.onSpeaker(null);
    }

    async function play() {
      const token = ++request;
      if (audio.ended) audio.currentTime = 0;
      error.classList.add("hidden");
      try { await audio.play(); }
      catch (e) { if (!destroyed && token === request) failed(); }
    }

    audio.onplay = () => { error.classList.add("hidden"); state("playing"); sync(); };
    audio.onplaying = () => { state("playing"); sync(); };
    audio.onpause = () => { state("paused"); sync(); };
    audio.onended = () => { state("ended"); sync(); };
    audio.onwaiting = () => { state("loading"); if (callbacks.onSpeaker) callbacks.onSpeaker(null); };
    audio.ontimeupdate = sync;
    audio.onseeked = sync;
    audio.onerror = failed;
    buttons.forEach((button) => { button.onclick = () => changeLanguage(button.dataset.kycLanguage); });

    const controller = {
      play,
      get playing() { return !audio.paused && !audio.ended; },
      stop() {
        request++;
        audio.pause();
        audio.currentTime = 0;
        state("stopped");
        sync();
      },
      destroy() {
        destroyed = true;
        request++;
        ["onplay", "onplaying", "onpause", "onended", "onwaiting", "ontimeupdate", "onseeked", "onerror"].forEach((name) => { audio[name] = null; });
        buttons.forEach((button) => { button.onclick = null; });
        audio.pause();
        audio.removeAttribute("src");
        audio.load();
      },
    };
    active = controller;
    changeLanguage(selected || I18N.language);
    return controller;
  }

  window.GMS_KYC_PLAYER = { matches, markup, mount, stop };
  window.addEventListener("pagehide", stop);
})();
