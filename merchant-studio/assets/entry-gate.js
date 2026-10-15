/* Browser-only entry gate for the static mockup.
   Static hosting needs server-side authentication to protect the source files. */
(function () {
  const PASSWORD_SHA256 = "10819d2628a6b73833db64d9e7cf8b2bf437c61d35c913a4d1412e46254daf2e";
  const scripts = ["assets/data.js", "assets/neo-export.js", "assets/kyc-audio.js", "assets/kyc-player.js", "assets/app.js"];
  const loaded = new Set();
  const form = document.getElementById("entry-form");
  const password = document.getElementById("entry-password");
  const error = document.getElementById("entry-error");
  const submit = document.getElementById("entry-submit");
  let opening = false;

  function showError(message, invalid) {
    error.textContent = message;
    password.setAttribute("aria-invalid", String(invalid));
    password.closest(".field").classList.toggle("has-error", invalid);
  }

  function loadScript(src) {
    if (loaded.has(src)) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.onload = () => { loaded.add(src); resolve(); };
      script.onerror = () => { script.remove(); reject(new Error("Application script failed to load.")); };
      document.body.appendChild(script);
    });
  }

  password.addEventListener("input", () => showError("", false));
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (opening) return;
    showError("", false);
    if (!password.value) {
      showError("Enter the password to continue.", true);
      password.focus();
      return;
    }

    opening = true;
    submit.disabled = true;
    password.readOnly = true;
    form.setAttribute("aria-busy", "true");
    let verified = false;
    try {
      if (!window.crypto || !window.crypto.subtle) {
        showError("Password verification is unavailable. Use a current browser with HTTPS or localhost.", false);
        return;
      }
      const digest = await window.crypto.subtle.digest("SHA-256", new TextEncoder().encode(password.value));
      const actual = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
      if (actual !== PASSWORD_SHA256) {
        showError("Incorrect password. Try again.", true);
        return;
      }

      verified = true;
      password.value = "";
      submit.textContent = "Opening…";
      for (const src of scripts) await loadScript(src);
    } catch (e) {
      showError(verified ? "The application could not load. Please try again." : "Password verification failed. Please try again.", false);
    } finally {
      opening = false;
      submit.disabled = false;
      submit.textContent = "Open application";
      password.readOnly = false;
      form.setAttribute("aria-busy", "false");
      if (password.isConnected) password.focus();
    }
  });

  submit.disabled = false;
  password.focus();
})();
