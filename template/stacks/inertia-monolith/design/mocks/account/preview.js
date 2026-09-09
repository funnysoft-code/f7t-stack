/* Static design-study interactions. No account operations or network requests. */
const selected = document.body.dataset.revision === "selected";
const direction = selected || location.pathname.endsWith("index-b.html") ? "b" : "a";
document.body.dataset.direction = direction;
document.title = `${direction === "a" ? "Focus" : "Companion"} | Account design study`;
document.querySelector("#direction-label").textContent = selected
  ? "Companion / Visual revision"
  : `${direction === "a" ? "A. Focus" : "B. Companion"} / Historical study`;
const other = document.querySelector("#other-direction");
other.textContent = selected ? "History" : "Current";
const screens = {
  home: "Home",
  login: "Sign in",
  register: "Create account",
  forgot: "Forgot password",
  reset: "Reset password",
  verification: "Verify email",
  confirmation: "Confirm password",
  profile: "Profile",
  security: "Security",
  passkeys: "Passkeys",
  authenticator: "Authenticator",
  challenge: "Two-factor challenge",
  recovery: "Recovery codes",
  deletion: "Delete account",
};
const params = new URLSearchParams(location.search);
const screen = Object.hasOwn(screens, params.get("screen")) ? params.get("screen") : "profile";
const state = ["default", "loading", "error", "success", "empty"].includes(params.get("state"))
  ? params.get("state")
  : "default";
other.href = `${selected ? "index-b.html" : "index.html"}?screen=${screen}&state=${state}`;
document.querySelector("#screen").innerHTML = Object.entries(screens)
  .map(([value, label]) => `<option value="${value}">${label}</option>`)
  .join("");
document.querySelector("#screen").value = screen;
document.querySelector("#state").value = state;
for (const id of ["screen", "state"])
  document.querySelector(`#${id}`).addEventListener("change", () => {
    location.search = new URLSearchParams({
      screen: document.querySelector("#screen").value,
      state: document.querySelector("#state").value,
    });
  });
const group = ["passkeys", "authenticator", "challenge", "recovery", "confirmation"].includes(
  screen,
)
  ? "security"
  : screen === "deletion"
    ? "profile"
    : screen;
document.querySelector(`[data-nav="${group}"]`)?.setAttribute("aria-current", "page");
const auth = [
  "login",
  "register",
  "forgot",
  "reset",
  "verification",
  "confirmation",
  "challenge",
].includes(screen);
if (auth) {
  document.querySelector(".identity").hidden = true;
  document.querySelector(".sidebar nav").innerHTML =
    '<a href="?screen=login">Sign in</a><a href="?screen=register">Create account</a>';
  document.querySelector(".brand").innerHTML =
    '<span class="mark" aria-hidden="true">f</span> Account access';
}
if (selected) document.querySelector(".brand").textContent = auth ? "Account access" : "Account";
const field = (id, label, type = "text", value = "", help = "") =>
  `<div class="field"><label for="${id}">${label}</label><input id="${id}" name="${id}" type="${type}" value="${value}" ${type === "password" ? 'autocomplete="' + (id === "current-password" ? "current-password" : "new-password") + '"' : type === "email" ? 'autocomplete="email"' : id === "name" ? 'autocomplete="name"' : id === "code" ? 'autocomplete="one-time-code" inputmode="numeric"' : ""} ${state === "error" ? 'aria-invalid="true"' : ""} ${help ? `aria-describedby="${id}-help"` : ""}><small id="${id}-help">${help}</small></div>`;
const action = (label, extra = "") =>
  `<button class="primary" type="submit" ${state === "loading" ? 'disabled aria-busy="true"' : ""}>${state === "loading" ? "Working…" : label}</button>${extra}`;
const link = (to, label) => `<a href="?screen=${to}">${label}</a>`;
const titles = {
  home: ["Good to see you, Alex.", "Your details, sign-in methods, and account controls."],
  profile: ["Personal details", "Choose how your name and email appear in your account."],
  security: [
    "Make your account yours.",
    "Manage how you sign in and keep access when plans change.",
  ],
  login: ["Welcome back", "Sign in to continue to your account."],
  register: ["Create your account", "Start with your name, email, and a password."],
  forgot: ["Forgot your password?", "We will email you a link to choose a new one."],
  reset: ["Choose a new password", "Use a password you do not use for another account."],
  verification: ["Check your inbox", "Verify your email before continuing to your account."],
  confirmation: ["Confirm it is you", "Enter your password before changing a security setting."],
  passkeys: ["Your passkeys", "Sign in with your fingerprint, face, or device screen lock."],
  authenticator: [
    "Add an authenticator",
    "Connect an authenticator app for an extra sign-in check.",
  ],
  challenge: ["One more check", "Enter a code from your authenticator app."],
  recovery: ["Keep a way back in", "Store recovery codes somewhere safe outside this account."],
  deletion: ["Delete your account", "Permanently remove your account and personal details."],
};
const messages = {
  profile: [
    "Your changes could not be saved. Check your email address and try again.",
    "Your personal details have been saved.",
  ],
  login: [
    "That email and password did not match. Try again or reset your password.",
    "You are signed in. Continue to your account.",
  ],
  register: [
    "This email already has an account. Sign in or reset your password.",
    "Account created. Check your inbox to verify your email.",
  ],
  forgot: [
    "We could not send the email. Try again in a moment.",
    "If an account uses this email, a reset link is on its way.",
  ],
  reset: [
    "This reset link has expired. Request a new link.",
    "Password changed. Sign in with your new password.",
  ],
  verification: [
    "This verification link has expired. Send a new email below.",
    "Email verified. You can continue to your account.",
  ],
  confirmation: [
    "That password did not match. Try again.",
    "Identity confirmed. Continue with the security change.",
  ],
  security: [
    "Your session expired. Sign in again before changing your security settings.",
    "Your security settings have been updated.",
  ],
  passkeys: [
    "Passkey setup was cancelled or is unavailable on this device. You can still sign in with your password.",
    "Passkey added. You can use this device to sign in.",
  ],
  authenticator: [
    "That code did not match. Use the latest code from your app.",
    "Authenticator enabled. Save your recovery codes next.",
  ],
  challenge: [
    "That code has expired or was already used. Enter a new code or use a recovery code.",
    "Code accepted. You can continue to your account.",
  ],
  recovery: [
    "We could not replace your recovery codes. Your existing codes still work.",
    "New recovery codes created. Previous codes no longer work.",
  ],
  deletion: [
    "Your password did not match. Your account has not been deleted.",
    "Your account has been deleted. You are now signed out.",
  ],
  home: [
    "Your account could not be loaded. Reload this preview to try again.",
    "Your account is up to date.",
  ],
};
const notice =
  state === "error" || state === "success"
    ? `<div class="notice ${state}" role="${state === "error" ? "alert" : "status"}"><strong>${state === "error" ? "Action needed" : "Done"}</strong><p>${messages[screen][state === "error" ? 0 : 1]}</p></div>`
    : state === "loading"
      ? '<div class="notice" role="status">Please wait. Your request is in progress.</div>'
      : "";
let content = "";
switch (screen) {
  case "profile":
    content = `<div class="avatar-row"><div class="avatar" aria-label="Alex Lee initials">AL</div><div><h3>Alex Lee</h3><p class="muted">Your personal account</p></div></div>${field("name", "Full name", "text", state === "empty" ? "" : "Alex Lee")}${field("email", "Email address", "email", state === "empty" ? "" : "alex@example.test", "Changing your email requires verification.")}<div class="actions">${action("Save changes")}</div><div class="section" style="margin-top:32px"><h3>Account ownership</h3><p>Manage the personal information stored in your account.</p>${link("deletion", "Delete account")}</div>`;
    break;
  case "home":
    content = `<div class="home-greeting"><div class="avatar">AL</div><h2>${state === "empty" ? "Let’s set up your account." : "Everything starts with you."}</h2><p class="muted">${state === "empty" ? "Add your details and a sign-in method to get started." : "Your email is verified. Add a passkey for a simpler sign-in."}</p></div><div class="home-list"><a href="?screen=profile"><strong>Personal details</strong><span>Your name and the email we use to reach you</span></a><a href="?screen=security"><strong>Sign-in & security</strong><span>Password, passkeys, and recovery options</span></a></div>`;
    break;
  case "login":
    content = `<button type="button" class="full" data-demo="passkey">Sign in with a passkey</button><div class="auth-divider">Or use your password</div>${field("email", "Email address", "email")}${field("current-password", "Password", "password")}<div class="actions">${action("Sign in", link("forgot", "Forgot password?"))}</div><p class="quiet">New here? ${link("register", "Create an account")}</p>`;
    break;
  case "register":
    content = `${field("name", "Full name")}${field("email", "Email address", "email")}${field("password", "Password", "password", "", "Use at least 12 characters. Password managers and paste work here.")}<div class="actions">${action("Create account")}</div><p class="quiet">Already have an account? ${link("login", "Sign in")}</p>`;
    break;
  case "forgot":
    content = `${field("email", "Email address", "email")}<div class="actions">${action("Send reset link", link("login", "Back to sign in"))}</div>`;
    break;
  case "reset":
    content = `${field("email", "Email address", "email", "alex@example.test")}${field("password", "New password", "password")}${field("password-confirmation", "Confirm new password", "password")}<div class="actions">${action("Reset password")}</div><p class="quiet">Link expired? ${link("forgot", "Request another link")}</p>`;
    break;
  case "verification":
    content = `<div class="notice"><strong>Sent to alex@example.test</strong><p>Open the verification link in your email. Check your spam folder if it has not arrived.</p></div><div class="actions">${state === "success" ? '<a class="button primary" href="?screen=home">Continue to account</a>' : action("Resend verification email")}</div><p class="quiet">Wrong account? ${link("login", "Sign out and try another email")}</p>`;
    break;
  case "confirmation":
    content = `${field("current-password", "Current password", "password")}<div class="actions">${action("Confirm password", link("security", "Cancel"))}</div><p class="quiet">This confirmation is required for sensitive account changes.</p>`;
    break;
  case "security":
    content = `<div class="section"><div class="row"><h2>Password</h2><span class="badge">Set</span></div><p>A unique password protects your account.</p>${field("current-password", "Current password", "password")}${field("password", "New password", "password")}<div class="actions">${action("Update password")}</div></div><div class="section"><div class="row"><div><h3>Passkeys</h3><p>${state === "empty" ? "No passkeys added yet." : "1 passkey on this account."}</p></div><a class="button" href="?screen=passkeys">Manage</a></div></div><div class="section"><div class="row"><div><h3>Two-factor authentication</h3><p>Use an authenticator app at sign-in.</p></div><a class="button" href="?screen=authenticator">Set up</a></div></div><a class="proof" href="?screen=recovery">View recovery options</a>`;
    break;
  case "passkeys":
    content = `${state === "empty" ? '<div class="notice"><strong>No passkeys yet</strong><p>Add one on a device you trust. Your password remains available.</p></div>' : '<div class="section"><div class="row"><div><h3>MacBook Pro</h3><p>Added today · This device</p></div><button type="button" data-demo="remove">Remove</button></div></div>'}${field("passkey-name", "Passkey name", "text", "", "Use a name that helps you recognize this device.")}<div class="actions">${action("Add passkey", link("security", "Back to security"))}</div><p class="quiet">Your device will ask for your fingerprint, face, or screen lock. Biometric data stays on your device.</p>`;
    break;
  case "authenticator":
    content = `<div class="notice"><strong>Design preview</strong><p>Production setup will show a scannable QR code and a copyable setup key here. No real secret is present in this mock.</p></div><h2>Connect your app</h2><p class="muted">Scan the setup code in your authenticator app, then enter its six-digit code below.</p>${field("code", "Authentication code", "text", "", "You can paste a code or use autofill.")}<div class="actions">${action("Enable authenticator", link("security", "Cancel"))}</div><p class="quiet">Already enabled? ${link("recovery", "View recovery codes")} or <button type="button" data-demo="disable">Disable authenticator</button></p>`;
    break;
  case "challenge":
    content = `${field("code", "Authentication code", "text", "", "Use the latest six-digit code from your app.")}<div class="actions">${action("Verify code")}</div><p class="quiet">Cannot use your app? <button type="button" data-demo="recovery">Use a recovery code</button></p>${link("login", "Back to sign in")}`;
    break;
  case "recovery":
    content = `<div class="notice"><strong>Each code works once</strong><p>Replacing these codes makes your previous codes unusable. These are nonfunctional sample codes.</p></div>${state === "empty" ? "<p>No recovery codes are available. Enable an authenticator to create them.</p>" : '<div class="recovery" aria-label="Nonfunctional example recovery codes"><span>DEMO-4826</span><span>DEMO-5917</span><span>DEMO-6308</span><span>DEMO-7429</span></div>'}<div class="actions">${action("Replace recovery codes", link("security", "Back to security"))}</div>`;
    break;
  case "deletion":
    content =
      state === "success"
        ? '<a class="button primary" href="?screen=register">Create a new account</a>'
        : `<div class="notice error"><strong>This cannot be undone</strong><p>Your profile, sign-in methods, and account data will be permanently removed. You will be signed out.</p></div>${field("current-password", "Confirm your password", "password")}<label class="checkline"><input type="checkbox" id="understand">I understand that deleting this account is permanent.</label><div class="actions"><button type="button" class="danger" data-demo="delete">Delete account</button>${link("profile", "Keep my account")}</div>`;
    break;
}
const companion = `<aside class="companion" aria-label="Security summary"><svg class="shield" viewBox="0 0 48 48" fill="none" aria-hidden="true"><path d="M24 4 40 10v13c0 10-9 17-16 21C17 40 8 33 8 23V10L24 4Z" stroke="currentColor" stroke-width="2"/><path d="m16 23 6 6 11-12" stroke="currentColor" stroke-width="2"/></svg><h2>${auth ? "A familiar way in." : "Your access, at a glance."}</h2><p>${auth ? "Use a password or a passkey. You choose what works on this device." : "Know what is protecting your account while you make a change."}</p><ul><li><strong>Email ${auth ? "verification" : "verified"}</strong><span>${auth ? "We will help you confirm your address." : "alex@example.test"}</span></li><li><strong>${auth ? "Password & passkeys" : "1 passkey"}</strong><span>${auth ? "Password managers and paste are welcome." : "A trusted device is ready to sign in."}</span></li><li><strong>Recovery options</strong><span>${auth ? "Another way in when your device is unavailable." : "Add an authenticator and store your recovery codes."}</span></li></ul>${link(auth ? "login" : "security", auth ? "Return to sign in" : "Review security")}<p class="companion-note">${auth ? "Your biometric information stays on your device." : "Security changes may ask you to confirm your password."}</p></aside>`;
document.querySelector("#main").innerHTML =
  `<p class="crumb">${auth ? "Account access" : "Your account"} / ${screens[screen]}</p><header class="page-head"><h1>${screen === "security" ? "Sign-in & security" : titles[screen][0]}</h1><p class="muted">${titles[screen][1]}</p></header><div class="layout ${auth ? "auth" : ""}"><div class="form-panel">${notice}<form novalidate>${content}</form><p class="demo-note">Interactive design study. All names and outcomes are examples.</p></div>${companion}</div><dialog aria-labelledby="dialog-title"><h2 id="dialog-title">Confirm account deletion</h2><p>Your account and sign-in methods will be removed permanently.</p><div class="actions"><button type="button" id="cancel-dialog">Keep my account</button><button type="button" class="danger" id="confirm-dialog">Delete account</button></div></dialog>`;
if (selected && screen === "security")
  document
    .querySelector("#password")
    .closest(".field")
    .insertAdjacentHTML(
      "afterend",
      field("password-confirmation", "Confirm new password", "password"),
    );
if (selected && screen === "deletion" && state === "success") {
  document.querySelector(".identity").hidden = true;
  document.querySelector(".sidebar nav").innerHTML =
    '<a href="?screen=login">Sign in</a><a href="?screen=register">Create account</a>';
  document.querySelector("h1").textContent = "Account deleted";
  document.querySelector(".page-head p").textContent =
    "Your personal details and sign-in methods have been removed.";
  document.querySelector(".companion").innerHTML =
    '<h2>You are signed out.</h2><p>Your old password, passkeys, and recovery codes no longer give access to this account.</p><a href="?screen=register">Create a new account</a>';
}
if (state === "error") {
  document
    .querySelectorAll("input[aria-invalid]")
    .forEach((input) => input.removeAttribute("aria-invalid"));
  const invalid = document.querySelector(
    screen === "profile" || screen === "register"
      ? "#email"
      : screen === "challenge" || screen === "authenticator"
        ? "#code"
        : "#current-password",
  );
  if (invalid) {
    invalid.setAttribute("aria-invalid", "true");
    invalid.setAttribute("aria-describedby", `${invalid.id}-help`);
    const help = document.getElementById(`${invalid.id}-help`);
    help.className = "field-error";
    help.textContent =
      invalid.type === "email"
        ? "Check this email address before trying again."
        : invalid.id === "code"
          ? "Enter a current code or choose a recovery option."
          : "Check your password and try again.";
  }
}
if (state === "empty" && !auth) {
  const items = document.querySelectorAll(".companion li");
  items[1].innerHTML =
    "<strong>No passkeys yet</strong><span>Add a passkey on a device you trust.</span>";
}
function go(nextState) {
  location.search = new URLSearchParams({ screen, state: nextState });
}
document.querySelector("form").addEventListener("submit", (event) => {
  event.preventDefault();
  const submit = event.submitter;
  if (submit) {
    submit.disabled = true;
    submit.textContent = "Working…";
    submit.setAttribute("aria-busy", "true");
  }
  setTimeout(() => go("success"), 500);
});
document.querySelectorAll("[data-demo]").forEach((button) =>
  button.addEventListener("click", () => {
    const kind = button.dataset.demo;
    if (kind === "delete") {
      if (
        !document.querySelector("#understand").checked ||
        !document.querySelector("#current-password").value
      ) {
        go("error");
        return;
      }
      document.querySelector("dialog").showModal();
      document.querySelector("#cancel-dialog").focus();
    } else if (kind === "recovery") {
      document.querySelector("label[for=code]").textContent = "Recovery code";
      document.querySelector("#code").inputMode = "text";
      document.querySelector("#code-help").textContent =
        "Enter one unused recovery code. Paste is supported.";
      document.querySelector("#code").focus();
      button.remove();
    } else if (kind === "disable" || kind === "remove") location.search = `screen=confirmation`;
    else if (kind === "passkey") {
      document.querySelector("#passkey-feedback")?.remove();
      button.insertAdjacentHTML(
        "afterend",
        '<div id="passkey-feedback" class="notice error" role="alert" style="margin-top:16px"><strong>Passkey sign-in did not finish</strong><p>It was cancelled or is unavailable on this device. Try again or use your password below.</p></div>',
      );
    } else go("error");
  }),
);
document
  .querySelector("#cancel-dialog")
  .addEventListener("click", () => document.querySelector("dialog").close());
document.querySelector("#confirm-dialog").addEventListener("click", () => go("success"));
document.querySelector("dialog").addEventListener("keydown", (event) => {
  if (event.key !== "Tab") return;
  const first = document.querySelector("#cancel-dialog");
  const last = document.querySelector("#confirm-dialog");
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});
