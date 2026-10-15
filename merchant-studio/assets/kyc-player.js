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
    let textNodes = [];
    let prompt;
    let highlighted = -1;
    let destroyed = false;
    let started = false;
    let frame = null;
    let request = 0;

    function state(value) {
      if (!destroyed && callbacks.onState) callbacks.onState(value);
    }

    function sync() {
      if (destroyed || !recording) return;
      const time = audio.currentTime || 0;
      const visibleTime = started || time > 0 ? time : -1;
      let index = -1;
      let revealed = false;
      let changed = false;
      recording.turns.forEach((turn, i) => {
        let endOffset = 0;
        for (const word of turn.words) {
          if (word.start > visibleTime) break;
          endOffset = word.endOffset;
        }
        const text = turn.text.slice(0, endOffset);
        if (textNodes[i].textContent !== text) {
          textNodes[i].textContent = text;
          changed = true;
        }
        messages[i].classList.toggle("hidden", endOffset === 0);
        revealed = revealed || endOffset > 0;
        if (visibleTime >= turn.words[0].start && visibleTime < turn.words[turn.words.length - 1].end) index = i;
      });
      prompt.classList.toggle("hidden", revealed);
      if (index !== highlighted) {
        messages.forEach((message, i) => message.classList.toggle("speaking", i === index));
        highlighted = index;
      }
      if (changed) transcript.scrollTop = transcript.scrollHeight;
      if (callbacks.onTime) callbacks.onTime(time);
      if (callbacks.onSpeaker) callbacks.onSpeaker(!audio.paused && index >= 0 ? recording.turns[index].who : null);
    }

    function cancelFrame() {
      if (frame !== null) window.cancelAnimationFrame(frame);
      frame = null;
    }

    function followAudio() {
      if (frame !== null || destroyed || audio.paused || audio.ended) return;
      frame = window.requestAnimationFrame(() => {
        frame = null;
        sync();
        followAudio();
      });
    }

    function changeLanguage(language) {
      if (!recordings[language]) return;
      request++;
      cancelFrame();
      audio.pause();
      started = false;
      selected = language;
      recording = recordings[language];
      audio.src = recording.src;
      audio.lang = recording.lang;
      audio.load();
      error.classList.add("hidden");
      buttons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.kycLanguage === language)));
      transcript.lang = recording.lang;
      transcript.innerHTML = '<p class="small muted" data-kyc-prompt>Play the recording to reveal the conversation.</p>' + recording.turns.map((turn) => `<div class="msg ${turn.who} hidden"><span class="who">${turn.who === "agent" ? escape(recording.persona) + " · AI" : "Customer"}</span><span data-kyc-text data-no-translate></span></div>`).join("");
      messages = Array.from(transcript.querySelectorAll(".msg"));
      textNodes = Array.from(transcript.querySelectorAll("[data-kyc-text]"));
      prompt = transcript.querySelector("[data-kyc-prompt]");
      highlighted = -1;
      transcript.scrollTop = 0;
      state("idle");
      if (callbacks.onTime) callbacks.onTime(0);
      if (callbacks.onSpeaker) callbacks.onSpeaker(null);
    }

    function failed() {
      cancelFrame();
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

    audio.onplay = () => { started = true; error.classList.add("hidden"); state("playing"); sync(); followAudio(); };
    audio.onplaying = () => { state("playing"); sync(); followAudio(); };
    audio.onpause = () => { cancelFrame(); state("paused"); sync(); };
    audio.onended = () => { cancelFrame(); state("ended"); sync(); };
    audio.onwaiting = () => { cancelFrame(); state("loading"); if (callbacks.onSpeaker) callbacks.onSpeaker(null); };
    audio.ontimeupdate = sync;
    audio.onseeking = sync;
    audio.onseeked = sync;
    audio.onerror = failed;
    buttons.forEach((button) => { button.onclick = () => changeLanguage(button.dataset.kycLanguage); });

    const controller = {
      play,
      get playing() { return !audio.paused && !audio.ended; },
      stop() {
        request++;
        cancelFrame();
        audio.pause();
        started = false;
        audio.currentTime = 0;
        state("stopped");
        sync();
      },
      destroy() {
        destroyed = true;
        request++;
        cancelFrame();
        ["onplay", "onplaying", "onpause", "onended", "onwaiting", "ontimeupdate", "onseeking", "onseeked", "onerror"].forEach((name) => { audio[name] = null; });
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
